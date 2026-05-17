# PROFILE_ACTIVITY_HISTORY

## Goal

Define what appears in the Zolaq user profile, where each data point comes
from, and **who can see what**. This is the privacy contract for the
gamification / engagement layer.

The profile lives under existing `/profile/**` routes (no new routes are added
in Sprint 7K). Sprint 9 (P1) adds three subsections inside those existing
routes: "Nişanlarım", "Aktivlik tarixçəm", "Mənim təxminlərim".

## What appears in the profile

Each row below names the surface, the canonical source, the rollout tier, and
the visibility tier (defined further below).

| Surface | Source | Tier | Visibility |
|---|---|---|---|
| Viewed cars | [ViewedCar](../../lib/decisions/types.ts) | Existing → **P0** profile display | Private |
| Saved cars | [SavedCar](../../lib/decisions/types.ts) | Existing → **P0** profile display | Private |
| Comparisons | `Comparison` row (Sprint 8 P0) — `(user_id, trim_ids[], created_at)` | **P0** | Private |
| Lead submissions | [Lead](../../lib/leads/types.ts) | Existing → **P0** profile display | Private |
| Lead status events | [LeadTimelineEvent](../../lib/leads/types.ts) | Existing → **P0** profile display | Private |
| Bazar Nəbzi votes (private list) | [`bazar_votes`](../sprint-7j/PREDICTION_HISTORY_MODEL.md) | **P0** | Private |
| Q&A questions | [QAEntry](../../lib/content/types.ts) | Existing → **P0** profile display | Public-content |
| Q&A answers | Sprint 8 `qa_answers` (extends `QAEntry`) | **P0** | Public-content |
| Helpful votes received | Sprint 9 `qa_helpful_votes` | P1 | Public-aggregate |
| Read encyclopedia / news | Tracking event log (read-only signal) | **P0** | Private |
| Earned badges (5 P0 badges only at launch) | `user_badges` (Sprint 8) | **P0** | Mixed (see below) |
| Points balance + history (6 P0 actions only) | `point_grants` (Sprint 8) | **P0** | Private (owner-only) |
| Activity timeline (basic unified view) | Derived read-model | **P0** | Private |

"Existing" means the data is already produced in Sprint 7 today; Sprint 7K
defines its profile-visibility contract and the Sprint 8 P0-lite engagement
layer (per [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
P0-lite section) brings the corresponding profile display online. "**P0**"
means the data and its profile display ship in Sprint 8. "P1" means Sprint 9.
"P2" means Sprint 10+.

Advanced surfaces remain post-P0:

- Helpful-vote aggregate display — **P1** (helpful-vote mechanics ship in
  Sprint 9 per [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)).
- "Mənim təxminlərim" personal Bazar Nəbzi accuracy slice — **P1** (the
  underlying `user_bazar_stats` derived view ships in Sprint 9 per
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md)).
- P1 badges (`smart_chooser`, `ev_researcher`, `price_watcher`,
  `test_drive_stage`) — Sprint 9.
- P2 badges (`helpful_answer`, `qa_helper`) — Sprint 10+.
- "Clear my history" and per-row hide actions on the activity timeline —
  **P2**.

## Privacy tiers

Four tiers cover every profile data point:

### Private (owner only)

- Viewed cars
- Saved cars
- Comparison history
- Lead submissions and their state events
- Bazar Nəbzi individual votes (per-topic option choices)
- Points balance and point-history
- Read encyclopedia / news items
- Activity timeline (consolidated view of the above)

Only the authenticated user (the owner) can see these. The profile route guards
this with the existing OTP session
([lib/auth/session.ts](../../lib/auth/session.ts)). Server-side endpoints
reject reads where `session.user_id != target_user_id`.

### Public-content (already public by nature of the content type)

- Q&A questions (the question is already a public CMS row).
- Q&A answers (each answer is a public CMS row after Moderator approval).

These appear under the user's profile only as a personal index/listing; the
underlying content is public on `/qa`.

### Public-aggregate (P1)

- Total helpful-vote count across the user's answers. **Counts only**, never
  per-answer identity of voters.

### Mixed — badges

- All earned badges are visible on the user's own profile view.
- A badge's appearance on a hypothetical public profile (P2 only) is controlled
  by a per-badge opt-in flag. **Default opt-in is none** — no badge surfaces
  publicly until the user actively opts in.
- No public profile page exists in P0 or P1. P2 reconsideration only.

## Who can see what

### The user (owner)

Sees everything in their own profile: private, public-content, public-aggregate,
all badges (including the unopted-in ones), points history.

### Another customer

Sees nothing about a target user in P0/P1 (no public-profile page exists). When
a public profile is revisited at P2, the visible set is:

- Q&A questions and answers authored by that user (already public on `/qa`).
- Helpful-vote totals (aggregate).
- Badges the user has opted in to display.

Nothing else.

### Admin / Moderator / Ops

- Sees everything in the private tier **except** the raw phone, which is
  exposed as `phone_hash` for non-Ops roles per
  [../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md](../sprint-7j/SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md)
  Section I. Ops Admin role can see raw phone where required.
- Read access is audit-logged.
- No edit access to history rows; corrections happen via Moderator actions
  (revoke badge, reverse points, invalidate vote, etc.) that produce
  compensating rows, never destructive edits.

### Dealer (Dealer Admin role)

**Cannot see**, for any user:

- Viewed cars.
- Saved cars.
- Comparison history.
- Bazar Nəbzi votes.
- Points balance.
- Badges.
- Read encyclopedia / news items.
- Activity timeline.
- Any aggregate derived from the above.

A dealer's only window into a customer is the [Lead](../../lib/leads/types.ts)
row assigned to that dealer, per existing
[../sprint-7j/DEALER_PORTAL_SCOPE.md](../sprint-7j/DEALER_PORTAL_SCOPE.md).
The dealer never sees the customer's profile, badges or points — even on the
lead row.

### Guest

Sees nothing about any user. There is no public-profile page in P0/P1.

## Activity timeline rules

- Read-only and append-only at the data layer.
- Unified across the source surfaces listed above, ordered by timestamp,
  paginated.
- The user may **hide individual rows** from their own view without deleting the
  underlying data (P2). Hidden rows still feed badge / point computations.
- The user may invoke a "Clear my history" action (P2) that erases the
  user-visible derived view but does **not** destroy authoritative source rows
  (`Lead`, `bazar_votes`, etc., remain — those are governed by separate
  retention policy).
- Activity timeline content is never exposed to dealers or in tracking-event
  payloads.

## Anti-leak rules

- Server-side endpoints that produce the activity timeline must enforce
  `session.user_id == target_user_id` on every fetch.
- Tracking events for badge grants and point grants follow the same PII rules
  as the existing event catalogue
  ([BANNED_PII_KEYS](../../lib/tracking/events.ts)). No phone, email or name
  appears in payloads.
- Dealer-facing API responses are explicitly scoped to lead-row fields; the
  user-profile schema is not reachable from any dealer route.

## Cross-references

- Engagement overview →
  [GAMIFICATION_ENGAGEMENT_LAYER.md](GAMIFICATION_ENGAGEMENT_LAYER.md)
- Badges → [USER_BADGE_SYSTEM.md](USER_BADGE_SYSTEM.md)
- Points → [COMMUNITY_POINTS_RULES.md](COMMUNITY_POINTS_RULES.md)
- Bazar Nəbzi vote privacy →
  [MARKET_PULSE_GAMIFICATION_RULES.md](MARKET_PULSE_GAMIFICATION_RULES.md)
- Trust hard rules →
  [GAMIFICATION_RISK_AND_TRUST_RULES.md](GAMIFICATION_RISK_AND_TRUST_RULES.md)
- Dealer-portal scoping →
  [../sprint-7j/DEALER_PORTAL_SCOPE.md](../sprint-7j/DEALER_PORTAL_SCOPE.md)
- Role / permission matrix →
  [../sprint-7j/ROLE_PERMISSION_MATRIX.md](../sprint-7j/ROLE_PERMISSION_MATRIX.md)
- Moderation contract →
  [../sprint-7j/COMMUNITY_MODERATION_SCOPE.md](../sprint-7j/COMMUNITY_MODERATION_SCOPE.md)
- Auth session →
  [lib/auth/session.ts](../../lib/auth/session.ts)

## Not in Sprint 7

Sprint 7K is documentation-only.

- The basic "Nişanlarım" and "Aktivlik tarixçəm" profile subsections, inside
  existing `/profile/**` routes — **ship in Sprint 8** per
  [SPRINT_9_GAMIFICATION_REQUIREMENTS.md](SPRINT_9_GAMIFICATION_REQUIREMENTS.md)
  P0-lite section, not in Sprint 7.
- The `Comparison`, `user_badges` (five P0 badge slugs), `point_grants` (six
  P0 action codes), and `qa_answers` tables — populated in Sprint 8.
- "Mənim təxminlərim" personal slice and `qa_helpful_votes` table — Sprint 9
  (P1).
- Public profile page — P2 only, with this doc revisited first.
- "Clear my history" and per-row hide actions on the activity timeline — P2.
