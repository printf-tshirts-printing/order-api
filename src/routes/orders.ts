import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { resolveSize } from "../sizing.js";
import { routeFacility } from "../facilities.js";
import { getAccount } from "../accounts.js";
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
  sizeSystem: z.enum(["US", "EU", "JP"]).optional(),
  destination: addressSchema,
  lines: z.array(z.object({
    designId: z.string().min(1),
    size: z.string().min(1),
    sizeSystem: z.enum(["US", "EU", "JP"]).optional(),
    fit: z.enum(["unisex", "fitted", "relaxed"]).optional(),
    quantity: z.number().int().positive().max(5000),
    garmentSku: z.string().min(1),
  })).min(1),
});

export async function orderRoutes(app: FastifyInstance) {
  app.post("/v2/orders", async (request, reply) => {
    const body = createOrderSchema.parse(request.body);
    const warnings: OrderWarning[] = [];

    const facilityId = body.facilityId ?? await routeFacility(body.destination);
    const account = await getAccount(body.accountId);

    if (body.sizeSystem === undefined && account.sizeSystem === undefined) {
      warnings.push({
        code: "size_system_implicit",
        message:
          "No size_system was given, so sizes resolved against the fulfilling " +
          "facility's default. Set size_system explicitly to pin this.",
        errorsIn: "2.6",
      });
    }

    const lines = body.lines.map((line) => ({
      ...line,
      resolvedSize: resolveSize(line.size, line.fit, {
        lineSystem: line.sizeSystem,
        orderSystem: body.sizeSystem,
        accountSystem: account.sizeSystem,
        facilityId,
        multiFacility: account.facilities.length > 1,
      }),
    }));

    const order: Order = {
      id: `ord_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`,
      accountId: body.accountId,
      status: "accepted",
      lines: lines as Order["lines"],
      facilityId,
      sizeSystem: lines[0]!.resolvedSize.system,
      destination: body.destination,
      createdAt: new Date().toISOString(),
      warnings,
    };

    await app.printQueue.enqueue(order);

    // Echo the system so a caller can tell what they got without parsing lines.
    return reply
      .code(201)
      .header("x-printf-size-system", order.sizeSystem)
      .send(order);
  });

  app.get("/v2/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await app.orders.get(id);
    if (!order) {
      return reply.code(404).send({ code: "order_not_found", message: `No order ${id}` });
    }
    return reply.header("x-printf-size-system", order.sizeSystem).send(order);
  });
}
