import type { FacilityId, Fit, SizeLabel, SizeSystem } from "./types.js";

/**
 * Size handling, v2.4.
 *
 * v2.3 assumed one ladder and that everybody meant the US one. That held until
 * Osaka opened and multi-facility routing shipped, at which point "L" stopped
 * being a size and started being a size *in a system nobody stated*.
 *
 * Ladders and conversions are owned by size-catalog. This module only decides
 * WHICH system applies to a given line, which is a routing question, not a
 * garment question.
 */

const LABELS: readonly SizeLabel[] = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const SYSTEMS: readonly SizeSystem[] = ["US", "EU", "JP"];

const FITS: readonly Fit[] = ["unisex", "fitted", "relaxed"];

/** Chest measurement in centimetres, flat, per label per system. */
const LADDERS: Record<SizeSystem, Record<SizeLabel, number>> = {
  US: { XS: 86, S: 91, M: 97, L: 102, XL: 112, "2XL": 122, "3XL": 132 },
  EU: { XS: 81, S: 86, M: 91, L: 97, XL: 102, "2XL": 112, "3XL": 122 },
  JP: { XS: 76, S: 81, M: 86, L: 91, XL: 97, "2XL": 102, "3XL": 112 },
};

const FACILITY_DEFAULT_SYSTEM: Record<FacilityId, SizeSystem> = {
  "fac-atx": "US",
  "fac-ber": "EU",
  "fac-osa": "JP",
};

export function isSizeLabel(value: string): value is SizeLabel {
  return (LABELS as readonly string[]).includes(value);
}

export function isSizeSystem(value: string): value is SizeSystem {
  return (SYSTEMS as readonly string[]).includes(value);
}

export function isFit(value: string): value is Fit {
  return (FITS as readonly string[]).includes(value);
}

export interface ResolvedSize {
  label: SizeLabel;
  system: SizeSystem;
  fit: Fit;
  chestCm: number;
}

export interface SystemResolutionContext {
  /** `size_system` on the individual order line, if the caller set one. */
  lineSystem?: string;
  /** `size_system` on the order envelope, if the caller set one. */
  orderSystem?: string;
  /** The account's configured preference, if it has one. */
  accountSystem?: SizeSystem;
  /** The facility this order will actually be printed at. */
  facilityId: FacilityId;
  /**
   * True when the account can route to more than one facility. Falling through
   * to a facility default is only safe when there is exactly one facility it
   * could ever be.
   */
  multiFacility: boolean;
}

/**
 * Decide which size system a line resolves against.
 *
 * Precedence, first hit wins:
 *   1. explicit `size_system` on the line
 *   2. explicit `size_system` on the order
 *   3. the account's configured preference
 *   4. the fulfilling facility's default
 *
 * Rule 4 is the dangerous one. For a single-facility account it is
 * indistinguishable from the old behaviour. For a multi-facility account it
 * means an identical payload can produce different garments depending on where
 * routing sent it — so we refuse instead of guessing.
 */
export function resolveSizeSystem(context: SystemResolutionContext): SizeSystem {
  const explicit = context.lineSystem ?? context.orderSystem;

  if (explicit !== undefined) {
    if (!isSizeSystem(explicit)) {
      throw Object.assign(new Error(`Unknown size system: ${explicit}`), {
        statusCode: 400,
        code: "size_system_unknown",
      });
    }
    return explicit;
  }

  if (context.accountSystem !== undefined) {
    return context.accountSystem;
  }

  if (context.multiFacility) {
    throw Object.assign(
      new Error(
        "This account routes to more than one facility, so a bare size label is " +
          "ambiguous. Set size_system on the order or on each line.",
      ),
      { statusCode: 400, code: "size_system_ambiguous" },
    );
  }

  return FACILITY_DEFAULT_SYSTEM[context.facilityId];
}

export function resolveSize(
  label: string,
  fit: string | undefined,
  context: SystemResolutionContext,
): ResolvedSize {
  if (!isSizeLabel(label)) {
    throw Object.assign(new Error(`Unknown size: ${label}`), {
      statusCode: 400,
      code: "size_unavailable",
    });
  }

  const resolvedFit: Fit = fit === undefined ? "unisex" : fit as Fit;
  if (!isFit(resolvedFit)) {
    throw Object.assign(new Error(`Unknown fit: ${fit}`), {
      statusCode: 400,
      code: "fit_unavailable",
    });
  }

  const system = resolveSizeSystem(context);

  return { label, system, fit: resolvedFit, chestCm: LADDERS[system][label] };
}

export function chestCm(label: SizeLabel, system: SizeSystem): number {
  return LADDERS[system][label];
}
