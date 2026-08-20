# order-api

Public REST API for Printf orders. Everything a customer can do with an order —
create it, price it, route it to a facility, track it — enters through here.

`api.printf.dev` · [docs](https://docs.printf.dev/api/orders) · owned by **orders**

## Running locally

```bash
npm install
npm run dev          # :8080, in-memory stores, no facility calls
npm test
```

`PRINTF_ENV=sandbox` points at the sandbox facility router and never enqueues a
real print job. Use it. Austin has printed test orders twice.

## Architecture

```
order-api ──▶ size-catalog        resolve size labels to garment SKUs
          ──▶ fulfillment-router  pick the facility for an order
          ──▶ print-queue         enqueue accepted orders
          ──▶ webhook-dispatcher  fan out order.* events to customers
```

The API is versioned in the path (`/v2`). We support the previous minor for
twelve months; deprecations ship in the response body as `warnings[]` before
they ship as errors.

## Conventions

- Handlers stay thin. Anything with a decision in it belongs in `src/`, not in
  `src/routes/`.
- Every customer-visible field change needs an `openapi.yaml` update in the same
  PR. The SDK generators and the docs site both build from that file, so a spec
  that lags the handler breaks five repos quietly.
- Errors use stable machine codes (`size_unavailable`, not "Size unavailable").
  Support macros match on the code.
