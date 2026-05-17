# SPRINT_9_GAMIFICATION_REQUIREMENTS

## Goal

Concrete engineering punch list that converts the Sprint 7K addendum into
Sprint 8 (P0-lite — minimal user-facing engagement layer) and Sprint 9 (P1 —
expanded engagement) tasks. Parallel to
[../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md).

The filename is preserved for stable cross-links from existing docs, but the
content is restructured per the CTO correction: Sprint 8 ships P0-lite
gamification at MVP, and Sprint 9 is now "expanded gamification" rather than
"first launch". The Sprint-8 P0-lite section below is the single source of
truth for what gamification ships at MVP.

P0 = Sprint 8 (MVP / commercial launch — **with** P0-lite engagement layer).
P1 = Sprint 9 (expanded engagement).
P2 = Sprint 10+.

Forward community direction (model communities, owner reviews, verified-owner
badge, shareable Q&A cards): see
[../sprint-8f/COMMUNITY_DECISION_LAYER.md](../sprint-8f/COMMUNITY_DECISION_LAYER.md).
Sprint 9H community work must align with that note.

## SPRINT_8_P0_LITE_GAMIFICATION_REQUIREMENTS

The MVP / Sprint 8 P0-lite engagement layer. Engineering scope below.

### S8-A. Bazar Nəbzi runtime (already in Sprint 7J Section F)

The following are owned by Sprint 7J
[SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
Section F. Listed here for cross-reference only — do not duplicate
engineering work:

- `bazar_topics`, `bazar_options`, `bazar_votes`, `bazar_topic_snapshots`
  tables per
  [../sprint-7j/PREDICTION_HISTORY_MODEL.md](../sprint-7j/PREDICTION_HISTORY_MODEL.md).
- Vote API with the six eligibility checks per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md).
- Homepage "Bazar nə deyir?" preview block.
- `/qa` Bazar Nəbzi tab with sub-tabs `Suallar`, `Bazar Nəbzi`, `Günlük`,
  `Həftəlik`, `Aylıq`, `Tarixçə`.
- Closed-topic history snapshots under `/qa` Tarixçə.

### S8-B. P0 badge table and grant engine (new Sprint-8 work)

- Add `lib/gamification/types.ts` exporting:
  - `BadgeId` (string-literal union over 11 badge slugs per
    [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)).
  - `BadgeDefinition` (shape defined in
    [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)).
  - `PointGrant` (shape defined in
    [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)).
  - `UserGamificationState` (`user_id`, `points_total`, `badges_earned`,
    `last_updated_at`).
- Add `lib/gamification/badges.ts` exporting the 11 `BadgeDefinition` rows.
  Sprint 8 enables grant logic for the **five P0 slugs**: `first_comparison`,
  `market_observer`, `encyclopedia_reader`, `official_offer_received`,
  `qa_participant`. The remaining six are present in the catalogue but the
  grant engine returns no-op for them in Sprint 8.
- `user_badges` table populated and writable:
  - `(user_id, badge_id, granted_at, granted_by_reason, revoked_at?)`.
  - Unique key per badge family: most are `(user_id, badge_id)`;
    `helpful_answer` is `(user_id, badge_id, answer_id)` (reserved for P2).
- Server-side grant engine listens to canonical domain events and grants the
  five P0 badges idempotently:
  - `Comparison` row write → `first_comparison`.
  - Bazar Nəbzi vote write (post-validity) → `market_observer` once the
    threshold is met.
  - Encyclopedia read event (≥30s dwell, distinct count ≥3) →
    `encyclopedia_reader`.
  - Lead transition to `offer_received` → `official_offer_received`.
  - First Moderator-approved Q&A action → `qa_participant`.
- Anti-abuse rules per [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md) enforced
  inside the engine.
- Every grant and revocation writes one audit-log row per Sprint 7J Section J.

### S8-C. P0 points ledger and daily-cap engine (new Sprint-8 work)

- `point_grants` table populated and writable:
  - `(id, user_id, action_code, points, reason_code, related_entity_kind,
    related_entity_id, granted_at, reversed_at?, reversed_by_user_id?)`.
- Server-side points engine listens to the same domain events as the badge
  engine and grants points for the **six P0 actions** per
  [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md):
  vote in Bazar Nəbzi, ask Q&A, answer Q&A, compare 2+ cars, submit verified
  lead, read encyclopedia/news.
- Daily-cap enforcement per UTC day, per `user_id`. Overflow silently drops
  (audit-log row only).
- The two P1 action codes (`helpful_answer` increment, Decision-step
  completion) are reserved in the action-code enum but the engine returns
  no-op for them in Sprint 8.

### S8-D. `Comparison` table (new Sprint-8 work)

- `(user_id, trim_ids[], created_at, hash)` with unique key `(user_id, hash)`.
- `hash` is the sorted-`trim_ids` hash, used for distinct-set dedup per
  [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md) anti-spam rules.
- Server-side endpoint that records a comparison when a user opens the
  Compare flow with ≥2 trims. (UI integration in Sprint 7J Section E /
  Compare flow is unchanged.)

### S8-E. Profile additions inside existing `/profile/**` (new Sprint-8 work)

- Minimal **"Nişanlarım"** subsection — list of the five P0 badges the user
  has earned, with `granted_at` and source action.
- Minimal **"Aktivlik tarixçəm"** subsection — unified activity timeline per
  [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md), paginated,
  private to the owner.
- "Mənim təxminlərim" is **not** in Sprint 8 — that ships in Sprint 9 with
  the `user_bazar_stats` derived view.
- All three sections live under existing `/profile/**` routes. **No new
  public route.** No public profile page.
- Server-side endpoint guards enforce `session.user_id == target_user_id` on
  every fetch.

### S8-F. Moderation guard for P0 grants (new Sprint-8 work)

- Q&A points and the `qa_participant` badge are granted only after
  Moderator-approved publication. Rejection writes a compensating
  `points_reversed` row in `point_grants` and a `badge_revoked` row in
  `user_badges`, both audit-logged.
- The Moderator queue defined in Sprint 7J Section K accepts the new entity
  kinds (`point_grant`, `user_badge`) for the compensating actions; a full
  Moderator UI for proactive revocation is P1, not P0.
- Suspicious-voting flags (per
  [../sprint-7j/COMMUNITY_PREDICTION_RULES.md](../sprint-7j/COMMUNITY_PREDICTION_RULES.md)
  "Suspicious-voting heuristics") pause point accrual on flagged accounts in
  P0; full heuristic surfacing UI is P1.

### S8-G. Acceptance gates for Sprint 8 P0-lite

- [ ] Five P0 badges grant on their canonical triggers; the other six badge
      slugs exist in the catalogue but the engine no-ops them.
- [ ] Six P0 point actions grant within their daily caps; the two P1 action
      codes exist in the enum but the engine no-ops them.
- [ ] `Comparison` table is populated on Compare-flow opens with ≥2 trims;
      distinct-set hash dedup works.
- [ ] "Nişanlarım" and "Aktivlik tarixçəm" subsections appear under existing
      `/profile/**` for the owning user only; dealer surfaces return zero
      gamification state.
- [ ] Spam-rejected Q&A reverses both the badge and the point grant via
      compensating audit-log rows.
- [ ] No badge or point grant affects Zolaq Recommendation output.
- [ ] No badge or point grant affects
      [DealerVerificationStatus](../../lib/dealers/types.ts) or
      [PriceRecord.verified](../../lib/cars/types.ts).
- [ ] No leaderboard, no public profile, no opt-in public-badge visibility, no
      cash redemption surface.
- [ ] Banned terminology absent from all P0-lite gamification UI strings.

## P0 (Sprint 8 — superseded by P0-lite above)

This document originally specified Sprint 8 P0 as "schema reservations only".
That framing is **superseded** by the SPRINT_8_P0_LITE_GAMIFICATION_REQUIREMENTS
section above. Sprint 8 ships the schema, the grant engines for the five P0
badges and six P0 point actions, the `Comparison` table, and the two minimal
profile subsections.

## P1 (Sprint 9 — expanded engagement)

Sprint 9 expands the P0-lite layer with the remaining badges, the helpful-vote
and Decision-step point actions, the Bazar Nəbzi derived stats, and the
Moderator tooling.

### D. P1 badge expansion

- Enable grant logic in `lib/gamification/badges.ts` for the four P1 slugs:
  `smart_chooser`, `ev_researcher`, `price_watcher`, `test_drive_stage`.
- Triggers per [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md):
  - Decision Center readiness threshold → `smart_chooser`.
  - ≥5 EV-tagged content reads → `ev_researcher`.
  - Saved-trim + price-change view → `price_watcher`.
  - Lead transition to `test_drive_scheduled` or beyond → `test_drive_stage`.
- Also raise the `encyclopedia_reader` threshold from the P0 setting (≥3
  distinct entries) to the P1 setting (≥10 entries across ≥3 categories) for
  new earners. Users who earned at the P0 bar keep the badge.

### E. P1 points expansion

- Enable grant logic in the points engine for the two P1 action codes per
  [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md):
  - `Answer marked helpful` (5 per helpful, daily cap 25).
  - `Complete a Decision Center step` (5 per first-time step completion,
    daily cap 15).
- Compensating reversal rows on Moderator rejection, Lead fraud finding, Q&A
  rejection. No destructive deletes.
- Admin Form fields (Content Manager + Super Admin) for retuning P0 and P1
  point values and caps without code change.

### F. Bazar Nəbzi derived stats

- Implement the `user_bazar_stats` materialised view per
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md).
- Recompute on every vote write and every Moderator invalidation.
- Read-only; never used for public ranking.

### G. "Mənim təxminlərim" profile subsection

- New subsection under existing `/profile/**` showing the user's Bazar Nəbzi
  personal slice (own votes, resolved outcomes, private accuracy count).
- Owner-visible only.

### H. Moderator tooling additions

- Extend the Sprint 8 Moderator queue (per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section K) with proactive action types:
  - `badge_revoke` — revokes a `user_badges` row, writes audit log, optional
    `reason_note`.
  - `points_reverse` — writes a compensating `point_grants` row referencing
    the original grant id, plus audit log.
- Both actions are reversible: a reinstated badge / restored points produces a
  new compensating row, never a destructive edit.

### I. Suspicious-voting heuristics surfacing

- Surface the heuristics enumerated in
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
  "Abuse detection requirements" as `ContentReport`-shaped rows in the
  Moderator queue.
- Heuristics flag for review only; never auto-revoke.
- Pause gamification accrual on flagged accounts (the basic pause behaviour
  is already in Sprint 8 P0-lite; Sprint 9 adds the Moderator-queue UI).

### J. Privacy enforcement (extends Sprint 8)

- Schema-level test that no badge / point / vote / saved-car field is
  reachable from any dealer API route. (The session-guard rule already ships
  in Sprint 8 P0-lite Section S8-E.)

### K. Acceptance gates for P1

- [ ] All four P1 badges grant on their canonical triggers.
- [ ] Both P1 point actions grant within their daily caps.
- [ ] `user_bazar_stats` materialised view recomputes on vote write and
      Moderator invalidation.
- [ ] "Mənim təxminlərim" subsection appears under existing `/profile/**` for
      the owning user only.
- [ ] Moderator can revoke a badge / reverse points via the queue UI, with
      compensating audit-log rows.
- [ ] Suspicious-voting heuristics surface to the Moderator queue.
- [ ] No badge or point grant affects Zolaq Recommendation output.
- [ ] No badge or point grant affects
      [DealerVerificationStatus](../../lib/dealers/types.ts) or
      [PriceRecord.verified](../../lib/cars/types.ts).
- [ ] No public per-user accuracy or ranking surface exists.
- [ ] Banned terminology absent from all gamification UI strings.
- [ ] All Bazar Nəbzi gamification additions remain read-only on top of the
      Sprint 7J authoritative tables — no schema mutation of those tables.

## P2 (Sprint 10+ — future)

- Leaderboards (non-redeemable, opt-in display).
- Seasonal challenges (e.g. "EV ay" reading challenge).
- Public profile pages — re-opens
  [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md) before any
  external visibility ships.
- Encyclopedia reading streaks.
- Q&A reputation deep view.
- "Clear my history" and per-row hide actions on the activity timeline.

## Cross-references (full Sprint 7K addendum)

1. [GAMIFICATION_ENGAGEMENT_LAYER.md](GAMIFICATION_ENGAGEMENT_LAYER.md) —
   overview
2. [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md) — badge catalogue
3. [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md) —
   Bazar Nəbzi gamification deltas
4. [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md) — points economy
5. [PROFILE_ACTIVITY_HISTORY.md](PROFILE_ACTIVITY_HISTORY.md) — profile +
   privacy
6. [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
   — hard rules
7. SPRINT_9_GAMIFICATION_REQUIREMENTS.md — this document

## Acceptance gate for Sprint 7K (this addendum, post-CTO correction)

- [x] 7 documents under `docs/sprint-7k/` (updated in place; none added,
      none renamed).
- [x] No code touched. No routes changed. No UI implementation.
- [x] No product flow changed (Decision Center Step 5 / 6 / 7 intact;
      Compare / Q&A / Lead / Content flows unchanged).
- [x] P0-lite gamification clearly part of MVP / Sprint 8 — five P0 badges,
      six P0 point actions, basic profile activity history, Bazar Nəbzi vote
      + `/qa` tab + closed-topic history.
- [x] Q&A is the home for Bazar Nəbzi and history — `/qa` with sub-tabs
      `Suallar`, `Bazar Nəbzi`, `Günlük`, `Həftəlik`, `Aylıq`, `Tarixçə`.
- [x] Daily / weekly / monthly cadence clearly defined (reaffirmed from
      Sprint 7J).
- [x] Clear P0 / P1 / P2 separation: P0 ships in Sprint 8, P1 in Sprint 9,
      P2 in Sprint 10+.
- [x] Clear distinction between gamification and gambling (banned vocabulary
      and "what this is NOT" reaffirmed across all docs).
- [x] Clear anti-abuse rules (per-badge anti-abuse rule; daily caps;
      Moderator-approval gating for Q&A grants).
- [x] Clear privacy rules (private / public-content / public-aggregate /
      mixed-badges tiers; dealer can NEVER see user activity history).
- [x] Recommendation / Dealer Verification / Official Price remain immune
      to gamification.
- [x] Sprint 8 implementation list updated with the new
      SPRINT_8_P0_LITE_GAMIFICATION_REQUIREMENTS section above.
- [ ] `npm run lint` / `type` / `build` — not required (no code touched).

## Not in Sprint 7

Sprint 7K is documentation-only.

- All engineering enumerated above (Sprint 8 P0-lite + Sprint 9 P1 +
  Sprint 10+ P2) is **deferred to its assigned sprint**, not to Sprint 7.
- P0-lite implementation (the five P0 badges, six P0 point actions,
  `Comparison` table, profile subsections, Moderation guard) lives in
  **Sprint 8**.
- P1 expansion lives in **Sprint 9**.
- P2 surfaces (leaderboards, public profile, streaks, advanced reputation)
  live in **Sprint 10+**.
