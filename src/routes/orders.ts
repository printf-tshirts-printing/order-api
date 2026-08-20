import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { assertSizeAvailable } from "../sizing.js";
import { routeFacility } from "../facilities.js";
import type { Order, OrderWarning } from "../types.js";

const addressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().optional(),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2),
});

const createOrderSchema = z.object({
  accountId: z.string().min(1),
  facilityId: z.enum(["fac-atx", "fac-ber", "fac-osa"]).optional(),
  destination: addressSchema,
  lines: z.array(z.object({
    designId: z.string().min(1),
    size: z.string().min(1),
    quantity: z.number().int().positive().max(5000),
    garmentSku: z.string().min(1),
  })).min(1),
});

export async function orderRoutes(app: FastifyInstance) {
  app.post("/v2/orders", async (request, reply) => {
    const body = createOrderSchema.parse(request.body);
    const warnings: OrderWarning[] = [];

    for (const line of body.lines) {
      assertSizeAvailable(line.size);
    }

    const facilityId = body.facilityId ?? await routeFacility(body.destination);

    const order: Order = {
      id: `ord_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`,
      accountId: body.accountId,
      status: "accepted",
      lines: body.lines as Order["lines"],
      facilityId,
      destination: body.destination,
      createdAt: new Date().toISOString(),
      warnings,
    };

    await app.printQueue.enqueue(order);
    return reply.code(201).send(order);
  });

  app.get("/v2/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await app.orders.get(id);
    if (!order) {
      return reply.code(404).send({ code: "order_not_found", message: `No order ${id}` });
    }
    return order;
  });
}
