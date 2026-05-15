// Price formatting. Step 5 §9 specifies "89 500 AZN" exactly — group separator
// is U+00A0 (non-breaking space) so the number cannot break across lines, and
// the currency suffix is the ISO code (no glyphs, mixed-script-safe with az UI).

import type { Currency } from "./types";

const GROUP_NBSP = " ";

function formatGrouped(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError("amount must be a finite number");
  }
  const grouped = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.trunc(amount));
  return grouped.replaceAll(",", GROUP_NBSP);
}

export function formatPrice(amount: number, currency: Currency): string {
  return `${formatGrouped(amount)} ${currency}`;
}

export function formatAzn(amount: number): string {
  return formatPrice(amount, "AZN");
}
