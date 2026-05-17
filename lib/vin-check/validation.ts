// Sprint 9H: ISO 3779 VIN validation. 17 chars, A-Z + 0-9, excluding I/O/Q.
// Includes the check-digit algorithm so junk input is rejected before any
// quota or provider call. Pure functions; no I/O.

const ALLOWED_CHARS = /^[A-HJ-NPR-Z0-9]{17}$/;

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5,         P: 7,         R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

export function isValidVin(input: string): boolean {
  const vin = normalizeVin(input);
  if (!ALLOWED_CHARS.test(vin)) return false;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i]!;
    const value = TRANSLITERATION[ch];
    if (value === undefined) return false;
    sum += value * WEIGHTS[i]!;
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
  return vin[8] === expected;
}

export function vinLast4(input: string): string {
  return normalizeVin(input).slice(-4);
}
