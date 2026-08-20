import type { Order } from "./types.js";

/** Replaced by the Postgres-backed store in every environment except `dev`. */
export class InMemoryOrderStore {
  #orders = new Map<string, Order>();

  async put(order: Order): Promise<void> {
    this.#orders.set(order.id, order);
  }

  async get(id: string): Promise<Order | undefined> {
    return this.#orders.get(id);
  }
}

export class PrintQueueClient {
  #url = process.env.PRINT_QUEUE_URL ?? "http://print-queue.internal";

  async enqueue(order: Order): Promise<void> {
    if (process.env.PRINTF_ENV === "sandbox") return;

    const response = await fetch(`${this.#url}/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: order.id, lines: order.lines, facilityId: order.facilityId }),
    });

    if (!response.ok) {
      throw Object.assign(new Error("print-queue rejected the job"), {
        statusCode: 502,
        code: "enqueue_failed",
      });
    }
  }
}

declare module "fastify" {
  interface FastifyInstance {
    orders: InMemoryOrderStore;
    printQueue: PrintQueueClient;
  }
}
