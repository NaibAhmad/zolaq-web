// Shared date formatter. Avoids Intl.DateTimeFormat("az-AZ", { month: "long" })
// which produces "2026 M05 3" style output in some Node/browser builds.

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDate(input: string | number | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateAz(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return typeof input === "string" ? input : "";
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatDateAzIso(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return typeof input === "string" ? input : "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
