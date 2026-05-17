# PREDICTION_HISTORY_MODEL

## Goal

Define how Bazar Nəbzi topics, votes, and the historical snapshot are stored and where the closed-topic history is shown to users. This is the schema doc for Sprint 8 implementation. Concept lives in `MARKET_PULSE_MODULE.md`. Rules and status enum live in `COMMUNITY_PREDICTION_RULES.md`.

## Storage placement (post-Sprint 8 DB; no data exists in MVP)

Three new tables / collections, plus one denormalized snapshot for the closed-topic feed:

1. `bazar_topics` — the topic record (active or closed).
2. `bazar_options` — multiple-choice options per topic (3–4 rows per topic).
3. `bazar_votes` — one row per `(topic_id, user_id)` vote.
4. `bazar_topic_snapshots` — denormalized resolved-topic record for the public history feed. Created on `status → resolved` and never edited after.

## Public placement

- **Live topics:** appear in the Bazar Nəbzi tab of `/qa` and (one per cadence) in the homepage "Bazar nə deyir?" block — see `MARKET_PULSE_MODULE.md`.
- **Closed-and-resolved topics:** appear in `/qa` Bazar Nəbzi history sub-tabs (Günlük / Həftəlik / Aylıq / Tarixçə). **No new public route in Sprint 7 or Sprint 8** — history piggybacks on the existing `/qa` route ([app/(public)/qa/page.tsx](../../app/(public)/qa/page.tsx)).
- **User profile (P1):** own prediction history ("Mənim təxminlərim") on a `/profile/bazar-nebzi` sub-page. P1 only.

## Schema sketch

```ts
// lib/bazar-nebzi/types.ts (Sprint 8)

import type { BazarTopicType, BazarTopicStatus } from "./types-status";
// Status + type enums are defined in COMMUNITY_PREDICTION_RULES.md

export const BAZAR_OPTION_MAX = 4;
export const BAZAR_OPTION_MIN = 3;

// ── Live topic record ─────────────────────────────────────────────────────

export type BazarTopic = {
  topic_id: string;
  title: string;                       // e.g. "EV marağı bu ay artacaq, azalacaq, yoxsa sabit qalacaq?"
  description?: string;                // optional longer context
  type: BazarTopicType;                // daily | weekly | monthly
  status: BazarTopicStatus;            // draft | sponsored_pending_approval | active | closed | resolved | archived | rejected
  start_date: number;                  // ISO timestamp at start-of-period
  end_date: number;                    // ISO timestamp at end-of-period (vote cutoff)
  options: BazarOption[];              // 3–4 options; lock once status leaves draft

  // Sponsorship metadata (null/false for organic topics)
  sponsored: boolean;
  sponsor_name?: string;               // required if sponsored=true; preserved forever on snapshot
  sponsor_buyer_id?: string;           // dealer_id or advertiser_id
  sponsored_order_id?: string;         // links to PAYMENT_INVOICE_FLOW.md Order
  sponsored_label: "Sponsorlu" | "Reklam" | null;

  // Related content
  related_trim_id?: string;            // links to a specific trim, for filtering/SEO
  related_brand_id?: string;
  related_category?: "price" | "ev" | "model_interest" | "compare" | "other";

  // Resolution fields (filled at status=resolved)
  final_outcome?: string;              // option_id, OR "inconclusive"
  zolaq_market_summary?: string;       // short editorial note in Azerbaijani

  // Audit fields
  created_by: string;                  // content_manager user_id
  created_at: number;
  updated_at: number;
  approved_by_sales?: string;          // sponsored only
  approved_by_content?: string;
  approved_by_moderator?: string;
  closed_at?: number;
  resolved_at?: number;
  archived_at?: number;
};

// ── Multiple-choice option ────────────────────────────────────────────────

export type BazarOption = {
  option_id: string;
  topic_id: string;
  label: string;                       // Azerbaijani user-visible text
  order_index: number;                 // 0..3 display order
};

// ── One user's vote on one topic ──────────────────────────────────────────

export type BazarVote = {
  vote_id: string;
  topic_id: string;
  option_id: string;
  user_id: string;                     // OTP-verified Customer
  voted_at: number;
  invalidated_at?: number;             // set by Moderator if vote-manipulation found
  invalidation_reason?: string;
};

// Unique constraint: (topic_id, user_id) — enforces "one vote per topic"
// (excluding invalidated votes, which remain in the table for audit but
// do not block a re-vote since vote-change is disallowed in P0 anyway).

// ── Historical snapshot (created on status → resolved) ────────────────────

export type BazarTopicSnapshot = {
  topic_id: string;                    // same as live topic
  title: string;
  type: BazarTopicType;
  start_date: number;
  end_date: number;

  // Frozen at close-time
  options: BazarOptionSnapshot[];
  total_votes: number;
  result_percentages: Record<string, number>;   // option_id → 0..100

  // Final outcome (frozen at resolve-time)
  final_outcome: string;                // option_id or "inconclusive"
  zolaq_market_summary: string;

  // Sponsorship metadata (frozen — sponsor name on history forever)
  sponsored: boolean;
  sponsor_name?: string;
  sponsored_label: "Sponsorlu" | "Reklam" | null;

  // Related content (frozen)
  related_trim_id?: string;
  related_brand_id?: string;
  related_category?: string;

  // Metadata
  status: "resolved" | "archived";
  resolved_at: number;
  archived_at?: number;
};

export type BazarOptionSnapshot = {
  option_id: string;
  label: string;
  order_index: number;
  vote_count: number;
  result_percent: number;               // 0..100
};
```

## Required fields per snapshot

Per the user's brief, every closed topic must store:

| Field | Live topic | Snapshot | Notes |
|---|---|---|---|
| `topic_id` | yes | yes | identity |
| `title` | yes | yes | frozen on resolve |
| `type` (daily / weekly / monthly) | yes | yes | |
| `start_date` | yes | yes | |
| `end_date` | yes | yes | |
| `status` | yes | yes | only `resolved` or `archived` in snapshot table |
| `options` | yes | yes | option labels frozen on resolve |
| `vote_count` per option | derived | frozen | denormalized at close |
| `result_percentages` | derived | frozen | denormalized at close |
| `final_outcome` | nullable | required | option_id or "inconclusive" |
| `zolaq_market_summary` | nullable | required | Content Manager's editorial note |
| `sponsored` flag | yes | yes | preserved forever |
| `sponsor_name` (optional unless sponsored) | yes | yes | required if `sponsored=true` |
| `related_trim_id` / `related_brand_id` / `related_category` | optional | optional | for filtering and SEO |

## Aggregation rules

- **Live aggregates** are computed on-demand from `bazar_votes` excluding invalidated votes.
- **Snapshot aggregates** are computed once at `status → closed` and stored on `bazar_topic_snapshots`. Subsequent vote invalidation by Moderator triggers a re-compute and a snapshot update + audit-log row.
- After `status → archived`, snapshot is immutable. Any correction requires a new audit-logged action by Super Admin and is rare.

## History view — how `/qa` Bazar Nəbzi tab renders

Reuses the existing `ContentList` and `ContentDetail` components ([components/content/ContentList.tsx](../../components/content/ContentList.tsx), [components/content/ContentDetail.tsx](../../components/content/ContentDetail.tsx)) with a new content-type adapter for `BazarTopicSnapshot`. Tabs / categories within `/qa`:

| Tab | Filter | Sort |
|---|---|---|
| Bazar Nəbzi | currently active topics (live, not snapshots) | end_date asc |
| Günlük | snapshots where `type = "daily"` | resolved_at desc |
| Həftəlik | snapshots where `type = "weekly"` | resolved_at desc |
| Aylıq | snapshots where `type = "monthly"` | resolved_at desc |
| Tarixçə | all snapshots | resolved_at desc |

Existing organic Q&A entries continue to render under their current tabs/categories. Bazar Nəbzi is additive.

## Indexing (for Sprint 8)

- `bazar_topics`: index on `(status, type, end_date)` for active-topic queries.
- `bazar_votes`: unique index on `(topic_id, user_id)`. Secondary index on `(topic_id, voted_at)` for vote-pattern analysis.
- `bazar_topic_snapshots`: index on `(type, resolved_at desc)` for history pagination. Index on `related_trim_id`, `related_brand_id` for filtered history views.

## SEO consideration

- Each resolved snapshot can have its own URL within `/qa`, e.g. `/qa/bazar/həftəlik/2026-may-19` or similar. Sprint 8 chooses the slug pattern.
- Sponsored snapshots remain crawlable but the `Sponsorlu` label and `nofollow` on sponsor links are mandatory.

## Cross-references

- Module concept and homepage placement → `MARKET_PULSE_MODULE.md`
- Voting rules and status transitions → `COMMUNITY_PREDICTION_RULES.md`
- Sponsored-topic integrity → `SPONSORED_MARKET_QUESTION_RULES.md`
- Moderation (vote invalidation) → `COMMUNITY_MODERATION_SCOPE.md`
- Sprint 8 admin tooling for topic management → `INTERNAL_ADMIN_MVP_SCOPE.md`

## Not in Sprint 7

- Any of these tables.
- Any UI for the `/qa` Bazar Nəbzi tab.
- Any snapshot rendering.
- Any tracking-event entries (added in Sprint 8 to [lib/tracking/events.ts](../../lib/tracking/events.ts)).
