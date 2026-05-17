import type { EncyclopediaCategory } from "./types";

export const ENCYCLOPEDIA_CATEGORY_LABELS: Record<
  EncyclopediaCategory,
  string
> = {
  tech: "Texnologiya",
  battery: "Batareya",
  driving: "Sürüş",
  finance: "Maliyyə",
  charging: "Şarj",
  insurance: "Sığorta",
};

export const ENCYCLOPEDIA_CATEGORY_ORDER: readonly EncyclopediaCategory[] = [
  "tech",
  "battery",
  "driving",
  "finance",
  "charging",
  "insurance",
];

export const ENCYCLOPEDIA_ALL_LABEL = "Hamısı";
export const ENCYCLOPEDIA_GENERIC_LABEL = "Ümumi";

export function categoryLabel(
  category: EncyclopediaCategory | undefined,
): string {
  return category ? ENCYCLOPEDIA_CATEGORY_LABELS[category] : ENCYCLOPEDIA_GENERIC_LABEL;
}
