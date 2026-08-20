import type { FacilityId, SizeSystem } from "./types.js";

export interface Account {
  id: string;
  plan: "Community" | "Booth" | "Keynote";
  /** Configured preference. Undefined means "we never asked". */
  sizeSystem?: SizeSystem;
  /** Every facility this account can route to. */
  facilities: FacilityId[];
}

const ACCOUNTS_URL = process.env.ACCOUNTS_URL ?? "http://accounts.internal";

export async function getAccount(accountId: string): Promise<Account> {
  const response = await fetch(`${ACCOUNTS_URL}/accounts/${encodeURIComponent(accountId)}`);

  if (response.status === 404) {
    throw Object.assign(new Error(`No account ${accountId}`), {
      statusCode: 404,
      code: "account_not_found",
    });
  }

  if (!response.ok) {
    throw Object.assign(new Error("accounts service unavailable"), {
      statusCode: 503,
      code: "account_lookup_unavailable",
    });
  }

  return (await response.json()) as Account;
}
