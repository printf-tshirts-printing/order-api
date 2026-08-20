# Changelog

## 2.4.0 — 2026-08-11

**Sizing and fit.**

- `POST /v2/orders` accepts `size_system` (`US`, `EU`, `JP`) on the order and on
  each line, and `fit` (`unisex`, `fitted`, `relaxed`) on each line.
- Responses and webhook payloads carry `resolved_size` per line:
  `{ label, system, fit, chest_cm }`.
- New `X-Printf-Size-System` response header echoes the system used.
- A bare size label now resolves in this order: line `size_system`, order
  `size_system`, the account's configured preference, then the fulfilling
  facility's default.
- Accounts routing to more than one facility get `400 size_system_ambiguous`
  rather than a facility-default guess.
- Single-facility accounts with no explicit system get a
  `size_system_implicit` warning. It becomes an error in 2.6.

## 2.3.6 — 2026-07-28
- `POST /v2/orders` rejects designs above 40 MB with `art_too_large` instead of
  timing out against art-validator.

## 2.3.4 — 2026-07-09
- Added `warnings[]` to order responses. Deprecations land here one minor before
  they become errors.

## 2.3.0 — 2026-06-15
- Multi-facility routing. An account can now be served by more than one facility;
  `fulfillment-router` picks per order based on destination and stock.
