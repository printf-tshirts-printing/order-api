import Fastify from "fastify";
import { orderRoutes } from "./routes/orders.js";
import { InMemoryOrderStore, PrintQueueClient } from "./stores.js";

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  requestIdHeader: "x-printf-request-id",
});

app.decorate("orders", new InMemoryOrderStore());
app.decorate("printQueue", new PrintQueueClient());

app.setErrorHandler((error, _request, reply) => {
  const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
  const code = (error as { code?: string }).code ?? "internal_error";
  // Support macros match on `code`, so it stays stable even when the prose changes.
  return reply.code(statusCode).send({ code, message: error.message });
});

await app.register(orderRoutes);

app.get("/healthz", async () => ({ status: "ok", version: process.env.SERVICE_VERSION }));

const port = Number(process.env.PORT ?? 8080);
await app.listen({ port, host: "0.0.0.0" });
