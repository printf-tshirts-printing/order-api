import type { Address, FacilityId } from "./types.js";

/**
 * Thin client over fulfillment-router. The router owns the real decision —
 * stock, capacity, customs — we only care which facility comes back.
 */

const ROUTER_URL = process.env.FULFILLMENT_ROUTER_URL ?? "http://fulfillment-router.internal";

export async function routeFacility(destination: Address): Promise<FacilityId> {
  const response = await fetch(`${ROUTER_URL}/route`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ destination }),
  });

  if (!response.ok) {
    throw Object.assign(new Error("fulfillment-router unavailable"), {
      statusCode: 503,
      code: "routing_unavailable",
    });
  }

  const { facilityId } = (await response.json()) as { facilityId: FacilityId };
  return facilityId;
}
