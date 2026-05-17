# USER_BADGE_SYSTEM

## Goal

Define the **11 user badges** for Zolaq, their trigger conditions, visibility,
rollout tier and anti-abuse rules. **Five badges ship at P0 in Sprint 8** as
part of the P0-lite engagement layer; the remaining six ship in Sprint 9 (P1)
or Sprint 10+ (P2). Sprint 8 engineering will mirror this catalogue in
`lib/gamification/badges.ts` (NEW file, Sprint 8) backed by the `user_badges`
table populated in Sprint 8 with the five P0 slugs.

The five P0 badges are: `first_comparison`, `market_observer`,
`encyclopedia_reader`, `official_offer_received`, `qa_participant`.

Badges are **non-redeemable**, cosmetic profile chrome. They never affect Zolaq
Recommendation, [DealerVerificationStatus](../../lib/dealers/types.ts),
[PriceRecord.verified](../../lib/cars/types.ts), Decision Center step logic,
or lead routing.

## Badge definition shape

```ts
// lib/gamification/badges.ts (Sprint 8 — P0 set; Sprint 9 — P1 additions)
export type BadgeDefinition = {
  badge_id: string;            // stable slug, e.g. "first_comparison"
  name: string;                // Azerbaijani display name
  description: string;         // one-line public description
  trigger_condition: string;   // server-side rule (described in prose here)
  visible_in_profile: boolean; // always true for the owning user
  tier: "P0" | "P1" | "P2";
  anti_abuse_rule: string;     // dedup / cool-down / verification
};
```

Visibility note: `visible_in_profile: true` means the **owning user** sees the
badge on their own profile. Whether *other users* can see it on a (future)
public profile is controlled by per-badge opt-in defaults defined in
[PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md). Default opt-in for
external visibility is **none** — no badge surfaces publicly until the user
explicitly opts in (a P2 concern).

## Catalogue

### 1. İlk müqayisə (`first_comparison`)

- **Description**: Verdiyiniz ilk müqayisəyə görə qazanılan nişan.
- **Trigger**: User's first `Comparison` row referencing ≥2 distinct trim_ids.
- **Visible in profile**: yes (owner only).
- **Tier**: **P0** (ships in Sprint 8).
- **Anti-abuse**: unique constraint `(user_id, badge_id)`; `Comparison` row must
  pass server-side distinct-trim-set hash (sorted trim_ids); deletion of the
  underlying comparison does not revoke the badge once granted.

### 2. Ağıllı seçimçi (`smart_chooser`)

- **Description**: Decision Center mərhələlərini başa vuran istifadəçi nişanı.
- **Trigger**: User reaches a readiness threshold computed from the existing
  [ReadinessSummary](../../lib/decisions/types.ts) — cosmetic only, layered
  after Decision Center finishes its native computation. The threshold itself
  is tunable in admin Form (P1) without changing Decision Center code.
- **Visible in profile**: yes (owner only).
- **Tier**: P1.
- **Anti-abuse**: unique `(user_id, badge_id)`; granted only on transitions of
  the canonical `DecisionStatus`, not on transient client state; revocable by
  Moderator if the underlying Decision is later flagged as test/spam.

### 3. EV araşdırıcısı (`ev_researcher`)

- **Description**: Elektromobillər haqqında ≥5 məzmunu oxudunuz.
- **Trigger**: User views ≥5 distinct encyclopedia / news entries tagged with an
  EV topic (per [EncyclopediaCategory](../../lib/content/types.ts) and news
  category fields), each with ≥30s dwell.
- **Visible in profile**: yes (owner only).
- **Tier**: P1.
- **Anti-abuse**: dedup by `(user_id, content_id)`; dwell-time validated
  server-side from tracking events; rapid back-to-back views from the same
  client are throttled.

### 4. Bazar müşahidəçisi (`market_observer`)

- **Description**: Zolaq Bazar Nəbzi-də fəal iştirakçı.
- **Trigger**: User has recorded valid votes (i.e. **not** invalidated per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md))
  on ≥3 distinct topics spanning ≥2 cadence bands (daily / weekly / monthly).
- **Visible in profile**: yes (owner only).
- **Tier**: **P0** (ships in Sprint 8).
- **Anti-abuse**: distinct `topic_id` count after subtracting Moderator-invalidated
  votes; cadence band must be derived from the topic's `type` field, not client
  state; flagged users (per suspicious-voting heuristics) pause progress.

### 5. Faydalı cavab (`helpful_answer`)

- **Description**: Cavabınız faydalı işarələndi.
- **Trigger**: An answer authored by the user reached `helpful_count ≥ N` (N
  configurable, default 5) and is not moderated/hidden.
- **Visible in profile**: yes (owner only).
- **Tier**: P2.
- **Anti-abuse**: helpful votes from the answer's author are excluded; helpful
  votes from accounts < 24h old are excluded; helpful-vote rings detected by the
  Moderator queue (per [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md))
  cause the badge to revoke; multiple `helpful_answer` grants are allowed (one
  per qualifying answer) — unique constraint is `(user_id, badge_id, answer_id)`.

### 6. Qiymət izləyicisi (`price_watcher`)

- **Description**: Saxladığınız modelin qiymət dəyişikliyini izlədiniz.
- **Trigger**: User saves a trim via [SavedCar](../../lib/decisions/types.ts) and
  subsequently views its [PriceCard](../../components/catalog/PriceCard.tsx)
  surface after a recorded `PriceRecord` change on that trim.
- **Visible in profile**: yes (owner only).
- **Tier**: P1.
- **Anti-abuse**: dedup on `(user_id, badge_id, trim_id)` is allowed (multiple
  trims may earn it independently); the price change must come from a canonical
  `PriceRecord` write in admin, not a client-side staleness reload.

### 7. Rəsmi təklif aldı (`official_offer_received`)

- **Description**: Rəsmi diler təklifi aldınız.
- **Trigger**: At least one [Lead](../../lib/leads/types.ts) for this user has
  transitioned to `LeadState = "offer_received"` (canonical
  [LeadTimelineEvent](../../lib/leads/types.ts)).
- **Visible in profile**: yes (owner only). **Never** visible to dealers.
- **Tier**: **P0** (ships in Sprint 8).
- **Anti-abuse**: granted on the canonical state transition only; multiple
  qualifying leads do not re-grant; if the lead is later flagged as fraudulent
  by Ops Admin, the badge is revoked.

### 8. Test-sürüş mərhələsində (`test_drive_stage`)

- **Description**: Bir lead-iniz test sürüş mərhələsinə çatdı.
- **Trigger**: A lead authored by this user reached `LeadState =
  "test_drive_scheduled"` or any subsequent state.
- **Visible in profile**: yes (owner only). **Never** visible to dealers.
- **Tier**: P1.
- **Anti-abuse**: granted on canonical state transition; not granted by a
  Customer-only client message ("we want a test drive") — only by the
  authoritative `LeadTimelineEvent` row.

### 9. Ensiklopediya oxucusu (`encyclopedia_reader`)

- **Description**: Müxtəlif kateqoriyalarda ensiklopediya yazılarını oxudunuz.
- **Trigger**:
  - **P0** (Sprint 8): user has viewed ≥3 distinct published encyclopedia
    entries, each with ≥30s dwell.
  - **P1** (Sprint 9): the threshold is raised to ≥10 distinct entries
    spanning ≥3 [EncyclopediaCategory](../../lib/content/types.ts) values
    (the badge is re-evaluated, not re-granted; users who hit the P0 bar
    keep the badge).
- **Visible in profile**: yes (owner only).
- **Tier**: **P0** (ships in Sprint 8 at the lower threshold; P1 raises the
  threshold for new earners).
- **Anti-abuse**: dedup by `(user_id, content_id)`; dwell-time validation; only
  published entries count, not drafts.

### 10. Q&A köməkçisi (`qa_helper`)

- **Description**: Q&A bölməsində ≥N təsdiqlənmiş cavab dərc etdiniz.
- **Trigger**: ≥N (default 5) of the user's Q&A answers are in `published`
  state per Moderator approval, and none have been moderated as spam.
- **Visible in profile**: yes (owner only).
- **Tier**: P2. (The simpler `qa_participant` badge below covers P0
  participation; `qa_helper` is the harder reputation badge.)
- **Anti-abuse**: any single answer rejected as spam disqualifies progress until
  the user accrues N fresh approved answers; dealer-affiliated promotional
  content is rejected per
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md);
  Moderator can revoke (`badge_revoked` audit row).

### 11. Q&A iştirakçısı (`qa_participant`)

- **Description**: Q&A icmasına ilk töhfənizi verdiniz.
- **Trigger**: The user's first Moderator-approved Q&A action (question OR
  answer) reaches the `published` state. One approval is sufficient.
- **Visible in profile**: yes (owner only).
- **Tier**: **P0** (ships in Sprint 8).
- **Anti-abuse**: unique constraint `(user_id, badge_id)`; spam-rejected items
  do **not** count toward the trigger; if the qualifying Q&A action is later
  moderated as spam, the badge is reversed via a compensating audit-log row
  per [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md);
  dealer-affiliated promotional content is rejected per
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md).

## Universal rules across all badges

- Badge grants and revocations write one row each to the global audit log
  defined in
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section J.
- Badges never appear on dealer-facing surfaces. Dealers see only the
  [Lead](../../lib/leads/types.ts) row assigned to them.
- Badges never appear in tracking-event payloads as user identifiers
  ([BANNED_PII_KEYS](../../lib/tracking/events.ts) continues to apply; badge
  state is a derived signal, not PII, but is excluded from external analytics
  payloads as a privacy default).
- Badges are not transferable. A merged / consolidated user account inherits the
  union of badges with the earlier `granted_at`.
- A badge revoked by a Moderator can be re-earned if the user's behaviour
  re-satisfies the trigger and the underlying spam / fraud finding is reversed.

## Cross-references

- Engagement overview →
  [GAMIFICATION_ENGAGEMENT_LAYER.md](GAMIFICATION_ENGAGEMENT_LAYER.md)
- Points that feed certain badge thresholds →
  [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)
- Bazar Nəbzi badge mechanics →
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md)
- Privacy and visibility →
  [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md)
- Trust hard rules →
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
- Underlying Bazar Nəbzi rules →
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)
- Underlying lead types →
  [lib/leads/types.ts](../../lib/leads/types.ts)
- Underlying Decision types →
  [lib/decisions/types.ts](../../lib/decisions/types.ts)

## Not in Sprint 7

Sprint 7K is documentation-only.

- `lib/gamification/badges.ts` with the **five P0 badges** and the badge-grant
  engine for their triggers — **ship in Sprint 8** per
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
  P0-lite section, not in Sprint 7.
- `user_badges` table population for the five P0 badges — Sprint 8.
- P1 badge additions (`smart_chooser`, `ev_researcher`, `price_watcher`,
  `test_drive_stage`) and Moderator revocation UI — Sprint 9.
- P2 badge additions (`helpful_answer`, `qa_helper`) — Sprint 10+.
- Any badge UI component — Sprint 8 (P0 set) / Sprint 9 (P1 set).
- Any tracking-event addition — Sprint 8.
- Any opt-in flow for public-profile badge visibility — P2 (revisit
  [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md) first).
