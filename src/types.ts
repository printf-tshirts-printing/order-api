export type SizeLabel = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL";

export type FacilityId = "fac-atx" | "fac-ber" | "fac-osa";

export interface OrderLine {
  /** Design to print. Must already have passed art-validator. */
  designId: string;
  size: SizeLabel;
  quantity: number;
  garmentSku: string;
}

export interface CreateOrderRequest {
  accountId: string;
  lines: OrderLine[];
  destination: Address;
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
  destination: Address;
  createdAt: string;
  warnings: OrderWarning[];
}
