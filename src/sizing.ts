import type { SizeLabel } from "./types.js";

/**
 * Size handling, v2.3.
 *
 * There is exactly one size ladder and everybody is assumed to mean the US one.
 * That assumption held right up until we opened Osaka.
 */

const LADDER: readonly SizeLabel[] = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function isSizeLabel(value: string): value is SizeLabel {
  return (LADDER as readonly string[]).includes(value);
}

/** Chest measurement in centimetres, used by the print templates. */
const CHEST_CM: Record<SizeLabel, number> = {
  XS: 86, S: 91, M: 97, L: 102, XL: 112, "2XL": 122, "3XL": 132,
};

export function chestCm(size: SizeLabel): number {
  return CHEST_CM[size];
}

export function assertSizeAvailable(size: string): asserts size is SizeLabel {
  if (!isSizeLabel(size)) {
    throw Object.assign(new Error(`Unknown size: ${size}`), {
      statusCode: 400,
      code: "size_unavailable",
    });
  }
}
