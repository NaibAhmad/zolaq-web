# Entity Relationship Map — Sprint 9A

Grouped by bounded context. ASCII diagram + adjacency list per group. Cardinality and `onDelete` policy noted on every edge.

Conventions:
- `─►` = FK pointer (child references parent).
- `1:N`, `1:1`, `N:M` = cardinality.
- `[CASCADE]` = on parent delete, child is deleted (owned children).
- `[RESTRICT]` = on parent delete, deletion is blocked (referential integrity guard).
- `[SET NULL]` = on parent delete, FK becomes NULL (optional reference).

---

## 1. Catalog

```
 Brand ──1:N──► Model ──1:N──► Generation
   │              │                │
   │              └─────1:N────┐   │
   │                           ▼   ▼
   └─────────1:N──────────────► Trim ──1:1──► TrimSpec
                                  │
                                  ├──1:N──► CatalogPrice
                                  │
                                  └──1:N──► DealerOffer ──N:1──► Dealer ──1:N──► DealerVerificationHistory
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `Model.brand_id ─► Brand.brand_id` | N:1 | RESTRICT | Brand has trims/offers downstream. |
| `Generation.brand_id ─► Brand.brand_id` | N:1 | RESTRICT | |
| `Generation.(brand_id, model_name) ─► Model.(brand_id, name)` | N:1 | RESTRICT | Composite FK — Trim/Generation today key by `model_name`, not `model_id`. ADR: keep composite FK to avoid invalidating seed. |
| `Trim.brand_id ─► Brand.brand_id` | N:1 | RESTRICT | |
| `Trim.(brand_id, model_name) ─► Model.(brand_id, name)` | N:1 | RESTRICT | Same ADR as Generation. |
| `Trim.generation_id ─► Generation.generation_id` | N:1 nullable | SET NULL | `generation_id` is optional on existing seed trims. |
| `TrimSpec.trim_id ─► Trim.trim_id` | 1:1 | CASCADE | Owned child (physical specs). New table — split from Trim row to keep Trim hot path slim. |
| `CatalogPrice.trim_id ─► Trim.trim_id` | N:1 | CASCADE | Multiple historical catalog price rows per trim allowed. |
| `DealerOffer.trim_id ─► Trim.trim_id` | N:1 | RESTRICT | Offers are FK-protected — deleting a trim with live offers is a data error. |
| `DealerOffer.dealer_id ─► Dealer.dealer_id` | N:1 | RESTRICT | |
| `DealerVerificationHistory.dealer_id ─► Dealer.dealer_id` | N:1 | CASCADE | Owned audit-of-verification trail. |

**Notes:**
- `Trim` is the canonical vehicle reference (`trim_id`). Every downstream domain that talks about "a car" FKs to `Trim`.
- `Model` is keyed by `model_id` going forward, but `Trim` and `Generation` continue to point to a model via `(brand_id, model_name)` composite — this is a deliberate carry-forward from the current seed shape ([lib/cars/types.ts](../../lib/cars/types.ts) `Trim.model_name`).

---

## 2. Customer

```
 User ──1:N──► OTPVerification
   │
   ├──1:N──► Lead ──1:N──► LeadEvent
   │           │
   │           └─N:1──► Trim
   │
   ├──1:N──► Decision ──1:N──► DecisionHistoryEvent
   │           │
   │           ├─N:1──► Trim (primary)
   │           ├─N:M──► Trim (candidates, JSON array — not a join table)
   │           └─N:M──► Lead (lead_ids, JSON array — not a join table)
   │
   ├──1:N──► SavedCar ──N:1──► Trim
   └──1:N──► ViewedCar ──N:1──► Trim

 CompareSession: NOT a DB entity. Client-only in localStorage
                 ([lib/compare/client-store.ts](../../lib/compare/client-store.ts)).
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `OTPVerification.user_id ─► User.id` | N:1 nullable | CASCADE | Pre-verification rows may exist before User row (lookup is by `phone_hash` until verification creates the User). |
| `Lead.user_id ─► User.id` | N:1 | RESTRICT | A user with leads is not deletable; soft-disable instead. |
| `Lead.trim_id ─► Trim.trim_id` | N:1 | RESTRICT | |
| `Lead.previous_lead_id ─► Lead.lead_id` | N:1 nullable | SET NULL | Second-offer chain. |
| `LeadEvent.lead_id ─► Lead.lead_id` | N:1 | CASCADE | Owned timeline. |
| `Decision.user_id ─► User.id` | N:1 | RESTRICT | |
| `Decision.primary_trim_id ─► Trim.trim_id` | N:1 | RESTRICT | |
| `Decision.candidate_trim_ids` | N:M as JSONB array | — | Deliberately denormalized — Decision is a working draft, not a foreign-key fortress. App validates membership. |
| `Decision.lead_ids` | N:M as JSONB array | — | Same as above. |
| `DecisionHistoryEvent.user_id ─► User.id` | N:1 | CASCADE | |
| `DecisionHistoryEvent.decision_id ─► Decision.decision_id` | N:1 nullable | SET NULL | Events can outlive their decision. |
| `SavedCar.(user_id, trim_id)` | composite UNIQUE | — | Idempotent save. |
| `ViewedCar.(user_id, trim_id)` | composite UNIQUE on most-recent | — | Repository upserts `viewed_at`. |

---

## 3. Content

```
 News ──┐
        │
 Encyclopedia ──┼──1:N──► ContentRead ──N:1──► User
        │
 QAQuestion ──1:N──► QAAnswer
        │
        └────────────────┘
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `ContentRead.user_id ─► User.id` | N:1 | CASCADE | |
| `ContentRead.content_id` | polymorphic by `content_type` | — | Single table; `content_type` discriminates (`news` / `encyclopedia` / `qa_question`). FK not enforced because Postgres lacks polymorphic FKs cheaply; app + repository validates. |
| `ContentRead.(user_id, content_type, content_id)` | composite UNIQUE | — | One read row per user per piece (idempotent). |
| `QAAnswer.question_id ─► QAQuestion.content_id` | N:1 | CASCADE | Owned. |
| `News.related_trim_ids`, `Encyclopedia.related_trim_ids`, `QAQuestion.related_trim_ids` | JSONB array of trim_ids | — | Not a join table — read-mostly, low-cardinality, no enforced FK. App validates on write. |

---

## 4. Commercial

```
 AdPackage (reference)        AdPlacement (reference)
       │                              │
       └──────────► AdRequest ◄───────┘
                       │ │
                       │ └──N:1──► Dealer (nullable — admin-initiated allowed)
                       │
                       └──1:1──► Invoice ──1:N──► PaymentProof
                                    │                  │
                                    └──1:N──► PaymentStatusHistory
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `AdRequest.package_type ─► AdPackage.package_type` | N:1 | RESTRICT | Reference table; never delete a package type that has historical ad requests. |
| `AdRequest.placement ─► AdPlacement.placement` | N:1 | RESTRICT | |
| `AdRequest.dealer_id ─► Dealer.dealer_id` | N:1 nullable | RESTRICT | NULL when `initiated_by='admin'`. |
| `AdRequest.invoice_id ─► Invoice.invoice_id` | 1:1 nullable | SET NULL | Set after admin issues invoice. |
| `Invoice.ad_request_id ─► AdRequest.ad_request_id` | N:1 | RESTRICT | Back-pointer; one invoice per ad request (UNIQUE). |
| `Invoice.dealer_id ─► Dealer.dealer_id` | N:1 nullable | RESTRICT | NULL for admin-initiated. |
| `Invoice.payment_proof_id ─► PaymentProof.payment_proof_id` | 1:1 nullable | SET NULL | Set when dealer uploads proof. |
| `PaymentProof.invoice_id ─► Invoice.invoice_id` | N:1 | CASCADE | |
| `PaymentProof.dealer_id ─► Dealer.dealer_id` | N:1 | RESTRICT | |
| `PaymentStatusHistory.invoice_id ─► Invoice.invoice_id` | N:1 | CASCADE | New owned-child table (replaces ad-hoc audit lookups for the invoice timeline). |

---

## 5. Community — Bazar Nəbzi

```
 MarketPulseTopic ──1:N──► MarketPulseOption
       │   │
       │   └────1:N──► MarketPulseVote ──N:1──► User
       │
       └──────1:N──► MarketPulseSnapshot
       │
       └──────N:1 nullable──► AdRequest (sponsor_ad_request_id)
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `MarketPulseOption.topic_id ─► MarketPulseTopic.topic_id` | N:1 | CASCADE | Owned. |
| `MarketPulseVote.topic_id ─► MarketPulseTopic.topic_id` | N:1 | CASCADE | |
| `MarketPulseVote.option_id ─► MarketPulseOption.option_id` | N:1 | RESTRICT | |
| `MarketPulseVote.user_id ─► User.id` | N:1 | RESTRICT | |
| `MarketPulseVote.(topic_id, user_id)` | composite UNIQUE | — | One vote per user per topic. |
| `MarketPulseSnapshot.topic_id ─► MarketPulseTopic.topic_id` | N:1 | CASCADE | Frozen aggregate at close/resolve time. |
| `MarketPulseTopic.sponsor_ad_request_id ─► AdRequest.ad_request_id` | N:1 nullable | SET NULL | Sponsor link. |

---

## 6. Gamification

```
 User ──1:N──► UserBadge
   │
   ├──1:N──► PointGrant
   │
   └──1:N──► ActivityEvent  (denormalized timeline — write-path optional in 9B
                              because [lib/gamification/activity.ts](../../lib/gamification/activity.ts)
                              currently aggregates from other stores at read time)
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `UserBadge.user_id ─► User.id` | N:1 | CASCADE | |
| `UserBadge.(user_id, badge_id)` | composite UNIQUE | — | Idempotent grant (matches [lib/gamification/badges.ts](../../lib/gamification/badges.ts) `grantBadge`). |
| `PointGrant.user_id ─► User.id` | N:1 | CASCADE | |
| `ActivityEvent.user_id ─► User.id` | N:1 | CASCADE | |

**Hard rule (codified in [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md)):** there is **no edge** from `Lead`, `DealerOffer`, `Decision`, `Trim`, or any catalog/recommendation/verification table into the gamification tables. Gamification reads from the rest of the schema; nothing in the rest of the schema reads from gamification.

---

## 7. Operations

```
 AdminUser ──N:M──► Role
       (via AdminUserRole join table)

 DealerUser ──N:1──► Dealer

 AuditLog (no FKs — soft-link by entity_type + entity_id)
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `AdminUserRole.admin_id ─► AdminUser.admin_id` | N:1 | CASCADE | New join table (current code attaches a single role per admin; promoted to N:M to allow editor + content_manager combos without code change). |
| `AdminUserRole.role_id ─► Role.role_id` | N:1 | RESTRICT | |
| `DealerUser.dealer_id ─► Dealer.dealer_id` | N:1 | CASCADE | New explicit entity. Today the dealer session ([lib/auth/dealer-session.ts](../../lib/auth/dealer-session.ts)) carries `contactName` only; production requires real users-of-dealer. |
| `AuditLog` | no FKs | — | Append-only; `(entity_type, entity_id)` and `(actor_type, actor_id)` are indexed but not FK-enforced (entity_type values include things like `"point_grant"`, `"user_badge"` that don't map to a single table). |

**Reference tables** (effectively read-only enums-with-metadata):
- `AdPackage` — 12 rows, one per `AdPackageType`. Carries display label + price hint.
- `AdPlacement` — 10 rows, one per `AdPlacementArea`. Carries surface display name.
- `Role` — 5 rows, one per `AdminRole`. Carries Az label + permission summary.

---

## 8. Cross-context summary

Every customer-facing FK eventually points to `User` (`user_id`) and/or `Trim` (`trim_id`). Every commercial FK eventually points to `Dealer` (`dealer_id`) and/or `AdRequest` (`ad_request_id`). The two halves of the graph touch at exactly two places:

1. `MarketPulseTopic.sponsor_ad_request_id` (commercial → community).
2. `DealerOffer` (catalog ↔ dealer).

Everything else stays within its bounded context, which is what makes the per-domain cutover order in [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) safe.

---

## Future entity groups (addendum — not in 9B–9D)

These groups are documented in addendum files and ship in later sprints. Full entity descriptors, FK policies, and constraints live in the linked docs.

### VIN Check (Sprint 9E — see [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md))

```
 User ──1:N──► VinCheckRequest ──1:1──► VinCheckResult ◄──N:1── VinCheckCache
   │                  │
   │                  └──N:1──► VinCheckProvider (server-only)
   │
   ├──1:N──► VinCheckQuota (one row per month_anchor)
   │
   └──1:N──► VinCheckCredit ──N:1──► (consumed_by_request_id) VinCheckRequest

 Dealer ──1:N──► VinCheckCredit  (dealer_bulk pool; mutually exclusive with user_id)
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `VinCheckRequest.user_id ─► User.id` | N:1 | RESTRICT | Tombstone on user delete; preserves audit lineage. |
| `VinCheckResult.request_id ─► VinCheckRequest.request_id` | 1:1 | CASCADE | Owned. |
| `VinCheckRequest.cache_hit_id ─► VinCheckCache.cache_id` | N:1 nullable | SET NULL | Soft reference. |
| `VinCheckCache.result_id ─► VinCheckResult.result_id` | N:1 | RESTRICT | Cache row depends on a canonical result. |
| `VinCheckRequest.provider_id ─► VinCheckProvider.provider_id` | N:1 nullable | SET NULL | Server-only column. |
| `VinCheckQuota.user_id ─► User.id` | N:1 | CASCADE | Quota is a derived counter. |
| `VinCheckCredit.user_id ─► User.id` | N:1 nullable | CASCADE | XOR with `dealer_id`. |
| `VinCheckCredit.dealer_id ─► Dealer.dealer_id` | N:1 nullable | CASCADE | Dealer bulk pool only. |

**Strict boundary:** VIN tables have **no** FK to `CatalogPrice`, `DealerOffer`, recommendation, or verification surfaces. VIN signals never mutate those tables.

### i18n (Sprint 9F — see [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md))

```
 Locale ◄──N──► ContentTranslation ──N:1──► Content
        ◄──N──► CarSpecTranslation
        ◄──N──► SeoMetadataTranslation
        ◄──N──► UserLanguagePreference ──1:1──► User
        ◄──N──► AdminTranslationWorkflow

 TranslationKey (catalog only; UI strings live in lib/i18n/translations/common.<locale>.json)
```

| Edge | Cardinality | onDelete | Notes |
|---|---|---|---|
| `ContentTranslation.content_id ─► Content.content_id` | N:1 | CASCADE | Owned translation. |
| `ContentTranslation.locale ─► Locale.locale_code` | N:1 | RESTRICT | Locale never deleted while translations exist. |
| `CarSpecTranslation.locale ─► Locale.locale_code` | N:1 | RESTRICT | |
| `SeoMetadataTranslation.locale ─► Locale.locale_code` | N:1 | RESTRICT | |
| `UserLanguagePreference.user_id ─► User.id` | 1:1 | CASCADE | |
| `UserLanguagePreference.locale ─► Locale.locale_code` | N:1 | RESTRICT | |
| `AdminTranslationWorkflow.locale ─► Locale.locale_code` | N:1 | RESTRICT | |

**Additive only:** no existing 9A/9B table is modified by the i18n addendum.
