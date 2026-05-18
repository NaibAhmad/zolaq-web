import { CompareEmpty } from "@/components/compare/CompareEmpty";
import {
  CompareTable,
  type CompareEntry,
} from "@/components/compare/CompareTable";
import { CompareRecommendation } from "@/components/compare/CompareRecommendation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getSession } from "@/lib/auth/session";
import { getServerT } from "@/lib/i18n/server";
import { BRANDS } from "@/lib/cars/seed";
import {
  getPricesForTrim,
  getTrimById,
} from "@/lib/cars/lookup";
import type {
  PriceRecord,
  PriceStatus,
} from "@/lib/cars/types";
import { onComparison } from "@/lib/gamification/hooks";

const STATUS_RANK: Record<PriceStatus, number> = {
  dealer_official_offer: 0,
  dealer_quote_pending: 1,
  catalog_price: 2,
  estimated: 3,
  expired_offer: 4,
  conflict: 5,
  price_unknown: 6,
  not_available: 7,
};

function pickBest(prices: PriceRecord[]): PriceRecord | null {
  if (prices.length === 0) return null;
  return [...prices].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  )[0];
}

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (t.length > 0) seen.add(t);
    if (seen.size >= 3) break;
  }
  return Array.from(seen);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const requestedIds = parseIds(ids);
  const t = await getServerT();

  if (requestedIds.length === 0) {
    return <CompareEmpty reason="no_ids" />;
  }

  const brandLookup = new Map<string, string>();
  for (const b of BRANDS) brandLookup.set(b.brand_id, b.name);

  const entries: CompareEntry[] = [];
  for (const id of requestedIds) {
    const trim = getTrimById(id);
    if (!trim) continue;
    const prices = getPricesForTrim(id);
    entries.push({
      trim,
      brandName: brandLookup.get(trim.brand_id) ?? trim.brand_id,
      bestPrice: pickBest(prices),
    });
  }

  if (entries.length < 2) {
    return <CompareEmpty reason="not_enough" providedCount={entries.length} />;
  }

  // Sprint 8F P0-lite: award first_comparison badge + capped daily points
  // when an OTP-verified user views a comparison of 2+ cars. Dedupe key is the
  // sorted trim-id set so the same comparison set only grants once.
  const session = await getSession();
  if (session) {
    const dedupeKey = `cmp:${entries
      .map((e) => e.trim.trim_id)
      .sort()
      .join("|")}`;
    onComparison(session.userId, dedupeKey);
  }

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container>
          <SectionHeading
            eyebrow={t("compareHero.eyebrow")}
            title={t("compareHero.filledTitle")}
            subtitle={t("compareHero.filledSubtitle")}
          />
          <div className="mt-4">
            <Badge tone="blue" size="md">
              {t("compareHero.carsBadge", { count: entries.length })}
            </Badge>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <CompareTable entries={entries} />
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container>
          <CompareRecommendation entries={entries} />
        </Container>
      </Section>
    </>
  );
}
