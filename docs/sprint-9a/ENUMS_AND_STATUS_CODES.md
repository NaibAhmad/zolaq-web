# Enums and Status Codes — Sprint 9A

Single source of truth for every closed-set enum currently scattered across `lib/*/types.ts`. The Prisma enum block in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md) mirrors this file 1:1.

Format per entry: **name** · values · where defined in code today · used by · transition rules (if a state machine) · public-facing labels reference.

---

## Catalog

### `EnergyType` (5)
`EV` · `PHEV` · `EREV` · `HEV` · `ICE`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts) `ENERGY_TYPES`. Used by `Trim.energy_type`, `TrimSpec.energy_type`, catalog filters, lead trim summary.

### `StockStatus` (4)
`available` · `order` · `not_available` · `coming_soon`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts) `StockStatus`. Used by `DealerOffer.stock_status`.

### `CatalogCurrency` (3)
`AZN` · `USD` · `CNY`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts) `Currency`. Used by `CatalogPrice.currency`, `DealerOffer.currency`.

### `InvoiceCurrency` (3) — **distinct from `CatalogCurrency`**
`AZN` · `USD` · `EUR`
Defined: [lib/invoices/types.ts](../../lib/invoices/types.ts). Used by `Invoice.currency`. Note: catalog uses CNY (Chinese imports), invoices use EUR (European hosting/ad partners). Do **not** unify.

### `SourceType` (6)
`official_dealer` · `catalog` · `partner` · `estimate` · `zolaq_manual` · `imported`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts). Used by `CatalogPrice.source_type`, `DealerOffer.source_type`.

### `VerificationStatus` (5)
`unverified` · `verified` · `pending` · `conflict` · `outdated`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts). Used by `CatalogPrice.verification_status`, `DealerOffer.verification_status`. **NOT** to be confused with `DealerVerificationStatus`.

### `PriceStatus` (8)
`estimated` · `catalog_price` · `dealer_quote_pending` · `dealer_official_offer` · `expired_offer` · `conflict` · `price_unknown` · `not_available`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts). Used by `CatalogPrice.status`, `DealerOffer.status`. Drives the public price-card surface label.

### `OfferStatus` (9) — state machine
`draft` · `submitted` · `under_review` · `needs_revision` · `approved` · `published` · `rejected` · `expired` · `cancelled`
Defined: [lib/cars/types.ts](../../lib/cars/types.ts) `OFFER_STATUSES`. Used by `DealerOffer.offer_status` and `DealerSubmission.status` (overlapping but separate enum — see Submissions below).

**Transitions** (dealer-offer review workflow):

| from | → to |
|---|---|
| `draft` | `submitted`, `cancelled` |
| `submitted` | `under_review`, `needs_revision`, `rejected`, `cancelled` |
| `under_review` | `approved`, `needs_revision`, `rejected` |
| `needs_revision` | `submitted`, `cancelled` |
| `approved` | `published`, `rejected` |
| `published` | `expired`, `cancelled` |
| `rejected`, `expired`, `cancelled` | (terminal) |

Public catalog reads filter `WHERE offer_status = 'published'`.

### `DealerVerificationStatus` (6)
`official_dealer` · `verified_partner` · `premium_partner` · `pending` · `rejected` · `expired`
Defined: [lib/dealers/types.ts](../../lib/dealers/types.ts) `DEALER_VERIFICATION_STATUSES`. Used by `Dealer.verification_status` and tracked in `DealerVerificationHistory`.

### `DealerService` (5)
`test_drive` · `trade_in` · `financing` · `delivery` · `warranty`
Defined: [lib/dealers/types.ts](../../lib/dealers/types.ts). Used by `Dealer.services[]`.

---

## Customer / Lead

### `LeadState` (12) — state machine
`draft` · `submitted` · `dealer_opened` · `official_offer` · `test_drive_requested` · `test_drive_confirmed` · `whatsapp_handoff` · `expired` · `no_response` · `second_offer` · `accepted` · `closed`
Defined: [lib/leads/types.ts](../../lib/leads/types.ts) `LEAD_STATES`. Used by `Lead.state`.

**Allowed transitions** (canonical — [lib/leads/state-machine.ts](../../lib/leads/state-machine.ts) `LEAD_ALLOWED_TRANSITIONS`):

| from | → to |
|---|---|
| `draft` | `submitted`, `closed` |
| `submitted` | `dealer_opened`, `no_response`, `whatsapp_handoff`, `closed` |
| `dealer_opened` | `official_offer`, `no_response`, `second_offer`, `closed` |
| `official_offer` | `test_drive_requested`, `accepted`, `expired`, `second_offer`, `whatsapp_handoff`, `closed` |
| `test_drive_requested` | `test_drive_confirmed`, `closed` |
| `test_drive_confirmed` | `accepted`, `second_offer`, `closed` |
| `whatsapp_handoff` | `official_offer`, `closed` |
| `expired` | `second_offer`, `official_offer`, `closed` |
| `no_response` | `second_offer`, `closed` |
| `second_offer` | `submitted`, `closed` |
| `accepted` | `closed` |
| `closed` | (terminal) |

**Trigger actor** per state (`LEAD_STATE_TRIGGER` in state-machine.ts) drives the dealer-vs-admin-vs-system attribution in the timeline.

### `LeadSourceSurface` (6)
`car_detail` · `catalog` · `compare` · `dealer_profile` · `content` · `decision_center`
Defined: [lib/leads/types.ts](../../lib/leads/types.ts). Used by `Lead.source_surface`. Drives attribution analytics.

### `LeadActor` (3)
`user` · `internal_operator` · `system`
Defined: [lib/leads/types.ts](../../lib/leads/types.ts). Used by `LeadEvent.actor`.

### `PreferredContact` (2)
`phone` · `whatsapp`
Defined: [lib/leads/types.ts](../../lib/leads/types.ts) `PREFERRED_CONTACTS`. Used by `Lead.preferred_contact`.

### `LeadTimelineEventType` (12)
`lead_draft_created` · `lead_submitted` · `lead_dealer_opened` · `lead_official_offer_received` · `test_drive_requested` · `test_drive_confirmed` · `whatsapp_handoff_created` · `offer_expired` · `lead_no_response` · `second_offer_requested` · `offer_accepted` · `lead_closed`
Defined: [lib/leads/types.ts](../../lib/leads/types.ts). Used by `LeadEvent.type`. State-to-event mapping is in `LEAD_AUDIT_EVENT` ([lib/leads/state-machine.ts](../../lib/leads/state-machine.ts)).

### `DecisionStatus` (4)
`active` · `decided` · `abandoned` · `closed`
Defined: [lib/decisions/types.ts](../../lib/decisions/types.ts) `DECISION_STATUSES`. Used by `Decision.status`. Repository sets `decided_at`/`abandoned_at`/`closed_at` on transition.

### `DecisionHistoryEventType` (12)
`search` · `viewed_model` · `saved_car` · `comparison_created` · `lead_submitted` · `dealer_replied` · `official_offer_received` · `whatsapp_clicked` · `test_drive_requested` · `price_changed` · `conflict_detected` · `offer_expired`
Defined: [lib/decisions/types.ts](../../lib/decisions/types.ts). Used by `DecisionHistoryEvent.type`.

### `OtpPurpose` (3)
`lead_submit` · `whatsapp_handoff` · `profile_access`
Defined: [lib/auth/constants.ts](../../lib/auth/constants.ts) `OTP_PURPOSES`. Used by `OTPVerification.purpose` and `Session.purpose`.

---

## Content

### `ContentType` (4 in DB; 3 in code today)
DB: `news` · `encyclopedia` · `qa_question` · `qa_answer`
Code today: `news` · `encyclopedia` · `qa` (single Q&A row, no split into question/answer).
Defined: [lib/content/types.ts](../../lib/content/types.ts) `CONTENT_TYPES`. The DB splits `qa` into `qa_question` + `qa_answer` per the schema; the repository layer maps the legacy `qa` value on read.

### `ContentStatus` (3) — state machine
`draft` · `published` · `unpublished`
Defined: [lib/content/types.ts](../../lib/content/types.ts) `CONTENT_STATUSES`.

**Transitions:** `draft → published → unpublished`. `unpublished` can return to `published` (re-publish). No deletion in MVP.

### `EncyclopediaCategory` (6)
`tech` · `battery` · `driving` · `finance` · `charging` · `insurance`
Defined: [lib/content/types.ts](../../lib/content/types.ts) `ENCYCLOPEDIA_CATEGORIES`. Used by `Encyclopedia.category`.

---

## Commercial

### `AdPackageType` (12)
`verified_dealer_package` · `premium_dealer_profile` · `featured_dealer_placement` · `featured_offer` · `sponsored_catalog_card` · `homepage_sponsored_block` · `content_sponsorship` · `compare_sponsored_offer` · `qa_sponsored_answer` · `bazar_nebzi_sponsored_question` · `qualified_lead_package` · `monthly_dealer_insight_report`
Defined: [lib/ads/types.ts](../../lib/ads/types.ts) `AD_PACKAGE_TYPES`. Used by `AdRequest.package_type` and as the PK of the `AdPackage` reference table.

### `AdPlacementArea` (10)
`homepage` · `catalog` · `car_detail` · `compare` · `dealer_list` · `dealer_detail` · `news_detail` · `encyclopedia_detail` · `qa` · `market_pulse`
Defined: [lib/ads/types.ts](../../lib/ads/types.ts) `AD_PLACEMENT_AREAS`. Used by `AdRequest.placement` and PK of `AdPlacement` reference table.

### `AdStatus` (13) — state machine
`draft` · `submitted` · `under_review` · `invoice_required` · `invoice_sent` · `payment_uploaded` · `paid` · `approved` · `active` · `paused` · `expired` · `rejected` · `cancelled`
Defined: [lib/ads/types.ts](../../lib/ads/types.ts) `AD_STATUSES`. Used by `AdRequest.status`.

**Transitions** (transitionAdStatus in [lib/ads/store.ts](../../lib/ads/store.ts)):

| from | → to |
|---|---|
| `draft` | `submitted`, `cancelled` |
| `submitted` | `under_review`, `rejected`, `cancelled` |
| `under_review` | `invoice_required`, `approved`, `rejected` |
| `invoice_required` | `invoice_sent`, `cancelled`, `rejected` |
| `invoice_sent` | `payment_uploaded`, `cancelled` |
| `payment_uploaded` | `paid`, `rejected` |
| `paid` | `approved`, `active` |
| `approved` | `active`, `cancelled` |
| `active` | `paused`, `expired`, `cancelled` |
| `paused` | `active`, `expired`, `cancelled` |
| `expired` | (terminal) |
| `rejected`, `cancelled` | (terminal) |

**Public-visibility statuses** (`AD_STATUSES_LIVE_OR_PENDING` in ads/types.ts): `submitted`, `under_review`, `invoice_required`, `invoice_sent`, `payment_uploaded`, `paid`, `approved`, `active`, `paused`.

### `AdLabel` (3)
`Sponsorlu` · `Reklam` · `Premium`
Defined: [lib/ads/types.ts](../../lib/ads/types.ts) `AD_LABELS`. **Invariant:** `AdRequest.status = 'active'` ⇒ `AdRequest.label IS NOT NULL`. Public render must show the label. Codified in [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md).

### `InitiatedBy` (2)
`dealer` · `admin`
Defined inline in [lib/ads/types.ts](../../lib/ads/types.ts) `AdRequest.initiated_by`. Used by `AdRequest.initiated_by` (admin can open ad requests with `dealer_id = null`).

### `InvoiceStatus` (6) — state machine
`pending` · `invoice_sent` · `payment_uploaded` · `paid` · `overdue` · `cancelled`
Defined: [lib/invoices/types.ts](../../lib/invoices/types.ts) `INVOICE_STATUSES`. Public label map in same file (`INVOICE_STATUS_LABEL_AZ`).

**Transitions:**

| from | → to |
|---|---|
| `pending` | `invoice_sent`, `cancelled` |
| `invoice_sent` | `payment_uploaded`, `overdue`, `cancelled` |
| `payment_uploaded` | `paid`, `invoice_sent` (proof rejected → back to awaiting) |
| `paid` | (terminal) |
| `overdue` | `payment_uploaded`, `cancelled` |
| `cancelled` | (terminal) |

### `PaymentProofStatus` (3) — state machine
`pending_review` · `approved` · `rejected`
Defined: [lib/payments/types.ts](../../lib/payments/types.ts) `PAYMENT_PROOF_STATUSES`. Public label map: `PAYMENT_PROOF_STATUS_LABEL_AZ`.

**Transitions:** `pending_review → approved | rejected` (both terminal).

---

## Community — Bazar Nəbzi

### `BazarCadence` (3)
`daily` · `weekly` · `monthly`
Defined: [lib/market-pulse/types.ts](../../lib/market-pulse/types.ts) `BAZAR_CADENCES`. Public label map: `BAZAR_CADENCE_LABEL_AZ`.

### `BazarTopicStatus` (7) — state machine
`draft` · `sponsored_pending_approval` · `active` · `closed` · `resolved` · `archived` · `rejected`
Defined: [lib/market-pulse/types.ts](../../lib/market-pulse/types.ts) `BAZAR_TOPIC_STATUSES`. Public label map: `BAZAR_STATUS_LABEL_AZ`.

**Transitions:**

| from | → to |
|---|---|
| `draft` | `active`, `rejected` (non-sponsored path) |
| `draft` (sponsored) | `sponsored_pending_approval` |
| `sponsored_pending_approval` | `active`, `rejected` |
| `active` | `closed` |
| `closed` | `resolved`, `archived` |
| `resolved` | `archived` |
| `archived`, `rejected` | (terminal) |

**Voting eligibility:** `MarketPulseVote` writes are accepted only when topic `status = 'active'`.

---

## Gamification

### `PointAction` (7)
`bazar_vote` · `qa_question` · `qa_answer_approved` · `comparison` · `verified_lead_submit` · `encyclopedia_read` · `news_read`
Defined: [lib/gamification/points.ts](../../lib/gamification/points.ts) `POINT_ACTIONS`. Used by `PointGrant.action`.

**Point values + daily caps** (constants in `points.ts`):

| Action | Points | Daily cap per user |
|---|---|---|
| `bazar_vote` | 5 | 3 |
| `qa_question` | 10 | 5 |
| `qa_answer_approved` | 15 | 5 |
| `comparison` | 5 | 5 |
| `verified_lead_submit` | 20 | 3 |
| `encyclopedia_read` | 2 | 5 |
| `news_read` | 2 | 5 |

**Caps must be enforced in the repository write path** (not the API layer) to survive any future caller.

### `BadgeId` (5) — P0 badges
`first_comparison` · `market_observer` · `encyclopedia_reader` · `qa_participant` · `official_offer_received`
Defined: [lib/gamification/badges.ts](../../lib/gamification/badges.ts) `P0_BADGE_IDS`. Catalogue (display name, description, trigger hint): `BADGE_CATALOGUE` in the same file.

**HARD RULE — cosmetic only.** Badges must NOT affect: Zolaq Recommendation, `DealerVerificationStatus`, `PriceRecord.verified`, Decision Center step logic, Lead routing. Enforced by absence of FKs from these tables into gamification — codified in [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md).

---

## Operations

### `AdminRole` (5)
`super_admin` · `internal_ops_admin` · `content_manager` · `sales_lead_manager` · `moderator`
Defined: [lib/auth/constants.ts](../../lib/auth/constants.ts) `ADMIN_ROLES`. Used by `AdminUser.role`, `Role.key`, `AdminSession.role`. Permission matrix lives in [docs/sprint-7j/ROLE_PERMISSION_MATRIX.md](../sprint-7j/ROLE_PERMISSION_MATRIX.md) — not duplicated here.

### `SubmissionKind` (4)
`profile_edit` · `offer_create` · `offer_update` · `media`
Defined: [lib/dealer/submissions/types.ts](../../lib/dealer/submissions/types.ts) `SUBMISSION_KINDS`. Used by `DealerSubmission.kind`.

### `SubmissionStatus` (9) — state machine
`draft` · `submitted` · `under_review` · `needs_revision` · `approved` · `published` · `rejected` · `expired` · `cancelled`
Defined: [lib/dealer/submissions/types.ts](../../lib/dealer/submissions/types.ts) `SUBMISSION_STATUSES`. Same value set as `OfferStatus` but tracked separately on the submission row (the submission is the *change proposal*; the offer is the *result* after approval applies the payload).

**Transitions:** mirror `OfferStatus`. `approved → published` is the application step that writes the payload into the canonical entity.

### `AuditActorType` (3)
`admin` · `dealer` · `system`
Defined: [lib/admin/types.ts](../../lib/admin/types.ts). Used by `AuditLog.actor_type`.

### `AuditAction` (62) — open-extending enum
Stored as `String` in the DB (not a Postgres enum) because the set extends each sprint. The TS union in [lib/admin/types.ts](../../lib/admin/types.ts) is the authoritative list:

- **Catalog (8):** `brand.create`, `brand.update`, `model.create`, `model.update`, `trim.create`, `trim.update`, `price.create`, `price.update`
- **Dealer (3):** `dealer.create`, `dealer.update`, `dealer.verify`
- **Offer (7):** `offer.create`, `offer.update`, `offer.submit`, `offer.approve`, `offer.reject`, `offer.request_revision`, `offer.publish`
- **Submission (5):** `submission.create`, `submission.resubmit`, `submission.approve`, `submission.reject`, `submission.request_revision`
- **Content (4):** `content.create`, `content.update`, `content.publish`, `content.unpublish`
- **Auth (4):** `admin.login`, `admin.logout`, `dealer.login`, `dealer.logout`
- **Ads (12):** `ad_request.create`, `ad_request.submit`, `ad_request.update`, `ad_request.approve`, `ad_request.reject`, `ad_request.request_revision`, `ad_request.activate`, `ad_request.pause`, `ad_request.expire`, `ad_request.cancel`, `ad_request.label_change`, `ad_request.placement_change`
- **Invoice (5):** `invoice.create`, `invoice.send`, `invoice.mark_paid`, `invoice.cancel`, `invoice.mark_overdue`
- **Payment (3):** `payment.upload`, `payment.approve`, `payment.reject`
- **Bazar (7):** `bazar_topic.create`, `bazar_topic.update`, `bazar_topic.publish`, `bazar_topic.close`, `bazar_topic.resolve`, `bazar_topic.archive`, `bazar_topic.reject`
- **Vote (1):** `bazar_vote.cast`
- **Gamification (3):** `badge.grant`, `point.grant`, `point.reverse`

**Total: 62 actions.** Adding a new mutation in any sprint requires adding to this union — code review must catch it.

---

## Tracking events (not in DB scope)

### `EventName` (27) — validated, not persisted in 9A
`search_started` · `search_completed` · `catalog_filter_applied` · `car_card_viewed` · `car_detail_viewed` · `price_card_viewed` · `compare_added` · `compare_opened` · `lead_form_opened` · `lead_form_submitted` · `otp_requested` · `otp_verified` · `whatsapp_clicked` · `whatsapp_external_opened` · `dealer_profile_viewed` · `offer_received` · `offer_expired` · `test_drive_requested` · `test_drive_confirmed` · `decision_center_opened` · `decision_created` · `decision_readiness_updated` · `next_best_action_clicked` · `decision_closed` · `content_viewed` · `related_model_clicked` · `cta_clicked`
Defined: [lib/tracking/events.ts](../../lib/tracking/events.ts). Not persisted in 9A scope — `app/api/events/route.ts` validates and drops. Future sink discussion deferred to post-MVP.

### Banned PII keys (enforced on tracking payloads + ActivityEvent.metadata)
`phone` · `raw_phone` · `phone_number` · `email` · `full_name` · `name` · `first_name` · `last_name`
Defined: [lib/tracking/events.ts](../../lib/tracking/events.ts) `BANNED_PII_KEYS`. Repository write paths must reject. Codified in [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md).

---

## Future enums (addendum — not in 9B–9D)

The following enums ship in later sprints. Full descriptors and transition tables live in the addendum docs.

### VIN Check (Sprint 9E — see [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md))

- `VinCheckStatus` (8) — `draft` · `validated` · `quota_checked` · `provider_pending` · `completed` · `failed` · `blocked` · `expired`. State machine; transitions in addendum §5.
- `VinReportType` (4) — `basic` · `full` · `promo_full` · `dealer_bulk`.
- `VinRiskLevel` (5) — `unknown` · `low` · `medium` · `high` · `critical`.
- `VinRiskFlag` (8) — `salvage_possible` · `theft_record_possible` · `odometer_issue_possible` · `title_issue_possible` · `accident_record_possible` · `flood_damage_possible` · `auction_record_possible` · `data_unavailable`. **`_possible`** suffix is mandatory for legal hygiene.
- `QuotaSource` (5) — `monthly_free` · `bonus` · `promo` · `admin_grant` · `paid`.

**New `AuditAction` values** (added to the existing `AuditAction` set, not a new enum): `vin_check_requested`, `vin_check_validated`, `vin_check_quota_checked`, `vin_check_cache_hit`, `vin_check_provider_dispatched`, `vin_check_completed`, `vin_check_failed`, `vin_check_blocked`, `vin_check_expired`, `vin_credit_granted`, `vin_credit_consumed`, `vin_credit_revoked`.

### i18n (Sprint 9F — see [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md))

- `Locale.locale_code` — natural-key string set: `az` (default) · `ru` · `en`. Modeled as a table row, not a Prisma `enum` (so locales can be added without a migration).
- **No new Prisma enums.** All i18n statuses (`draft` / `review` / `published` / `stale` / `missing`, plus `set_via` values `auto_detect` / `manual_switch` / `signup`) live as `String` columns with TS unions in code, mirroring how `AuditAction` is handled today.

**New `AuditAction` values** for i18n: `translation_drafted`, `translation_reviewed`, `translation_published`, `translation_unpublished`.
