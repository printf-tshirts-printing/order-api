export type SizeLabel = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL";

export type SizeSystem = "US" | "EU" | "JP";

export type Fit = "unisex" | "fitted" | "relaxed";

export type FacilityId = "fac-atx" | "fac-ber" | "fac-osa";

export interface ResolvedSize {
  label: SizeLabel;
  system: SizeSystem;
  fit: Fit;
  chestCm: number;
}

export interface OrderLine {
  /** Design to print. Must already have passed art-validator. */
  designId: string;
  size: SizeLabel;
  /**
   * Which ladder `size` is measured against. Optional; when absent it resolves
   * from the order, the account, or the fulfilling facility, in that order.
   */
  sizeSystem?: SizeSystem;
  /** Defaults to `unisex`. */
  fit?: Fit;
  quantity: number;
  garmentSku: string;
  /** Populated on the response. What we will actually print. */
  resolvedSize?: ResolvedSize;
}

export interface CreateOrderRequest {
  accountId: string;
  lines: OrderLine[];
  destination: Address;
  /** Applies to every line that does not set its own. */
  sizeSystem?: SizeSystem;
  /** Optional. When absent, fulfillment-router picks the facility. */
  facilityId?: FacilityId;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: string;
}

export interface OrderWarning {
  code: string;
  message: string;
  /** Minor version in which this warning becomes a hard error. */
  errorsIn?: string;
}

export interface Order {
  id: string;
  accountId: string;
  status: "accepted" | "in_production" | "shipped" | "cancelled";
  lines: OrderLine[];
  facilityId: FacilityId;
  /** The system every line without an explicit one resolved against. */
  sizeSystem: SizeSystem;
  destination: Address;
  createdAt: string;
  warnings: OrderWarning[];
}
