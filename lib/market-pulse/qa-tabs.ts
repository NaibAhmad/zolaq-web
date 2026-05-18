import type { TranslationKey } from "@/lib/i18n/types";

export type QaTabKey =
  | "suallar"
  | "bazar-nebzi"
  | "gunluk"
  | "heftelik"
  | "ayliq"
  | "tarixce";

export type QaTabDef = {
  key: QaTabKey;
  labelKey: TranslationKey;
  fallback: string;
};

export const QA_TAB_DEFS: ReadonlyArray<QaTabDef> = [
  { key: "suallar", labelKey: "nav.qa", fallback: "Sorğu" },
  { key: "bazar-nebzi", labelKey: "bazar.badge", fallback: "Bazar Nəbzi" },
  { key: "gunluk", labelKey: "bazar.daily", fallback: "Gündəlik" },
  { key: "heftelik", labelKey: "bazar.weekly", fallback: "Həftəlik" },
  { key: "ayliq", labelKey: "bazar.monthly", fallback: "Aylıq" },
  { key: "tarixce", labelKey: "bazar.tabHistory", fallback: "Tarixçə" },
];

export const QA_TABS: ReadonlyArray<{ key: QaTabKey; label: string }> =
  QA_TAB_DEFS.map((t) => ({ key: t.key, label: t.fallback }));

export function isQaTab(value: string | null | undefined): value is QaTabKey {
  return !!value && QA_TAB_DEFS.some((t) => t.key === value);
}
