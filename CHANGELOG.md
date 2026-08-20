# Changelog

## 2.3.6 — 2026-07-28
- `POST /v2/orders` rejects designs above 40 MB with `art_too_large` instead of
  timing out against art-validator.

## 2.3.4 — 2026-07-09
- Added `warnings[]` to order responses. Deprecations land here one minor before
  they become errors.

## 2.3.0 — 2026-06-15
- Multi-facility routing. An account can now be served by more than one facility;
  `fulfillment-router` picks per order based on destination and stock.
