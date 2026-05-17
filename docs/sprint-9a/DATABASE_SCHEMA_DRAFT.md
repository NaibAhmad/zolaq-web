# Database Schema Draft — Sprint 9A

**Target:** PostgreSQL via Prisma.
**Status:** documentation-only draft. The Prisma block below is **not** committed to the repo as `prisma/schema.prisma` — that happens in Sprint 9B step 1.

All enums match the source-of-truth `as const` arrays in [`lib/*/types.ts`](../../lib/). When a value is added to the enum in code, this schema and [ENUMS_AND_STATUS_CODES.md](ENUMS_AND_STATUS_CODES.md) must change in the same PR.

---

## ADR — `PriceRecord` split

Today [`lib/cars/types.ts`](../../lib/cars/types.ts) defines a single `PriceRecord` that may be a catalog price (no `dealer_id`) **or** a dealer offer (has `dealer_id`, `offer_id`, `offer_status`, `valid_until`, etc.). One table cannot enforce "all dealer fields required when offer_status set" without a chain of check constraints, and conflating them obstructs the partial index we need (`WHERE offer_status='published'`).

**Decision:** split into two tables.

- `CatalogPrice` — `trim_id`, `amount`, `currency`, `status` (the non-dealer subset of `PriceStatus`), `source_type`, `source_name`, `verification_status`, `last_updated`. No dealer FK.
- `DealerOffer` — `trim_id`, `dealer_id`, `amount`, `currency`, full lifecycle fields, `offer_status`, `valid_until`, `published_at`, etc.

**Invisible above the repository layer.** `lib/cars/repository.ts` exposes `getPriceForTrim(trimId)` that returns the existing `PriceRecord` union; consumers (catalog, car detail, compare, decision center) keep working without change.

---

## ADR — preserved natural keys

Existing string IDs that already live in URLs, audit history, decision history, and seed exports keep their natural-key form:

`trim_id`, `brand_id`, `model_id`, `generation_id`, `dealer_id`, `lead_id`, `decision_id`, `saved_id`, `viewed_id`, `content_id` (with content-type-prefix), `topic_id`, `option_id`, `vote_id`, `ad_request_id`, `invoice_id`, `payment_proof_id`, `badge_grant_id`, `point_grant_id`, `audit_id`.

New entities introduced in 9A use `@default(cuid())`: `TrimSpec`, `ContentRead`, `PaymentStatusHistory`, `AdPackage`, `AdPlacement`, `DealerVerificationHistory`, `MarketPulseSnapshot`, `Role`, `AdminUserRole`, `DealerUser`, `ActivityEvent`.

---

## Prisma schema draft

```prisma
// ---------------------------------------------------------------------------
//  zolaq — production schema draft (Sprint 9A)
//  Do NOT commit this file to prisma/schema.prisma yet — Sprint 9B step 1.
// ---------------------------------------------------------------------------

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [citext]
}

// ===========================================================================
//  ENUMS
// ===========================================================================

enum EnergyType        { EV PHEV EREV HEV ICE }
enum StockStatus       { available order not_available coming_soon }
enum CatalogCurrency   { AZN USD CNY }                            // lib/cars/types.ts
enum InvoiceCurrency   { AZN USD EUR }                            // lib/invoices/types.ts — different set
enum SourceType        { official_dealer catalog partner estimate zolaq_manual imported }
enum VerificationStatus{ unverified verified pending conflict outdated }
enum PriceStatus       { estimated catalog_price dealer_quote_pending dealer_official_offer expired_offer conflict price_unknown not_available }
enum OfferStatus       { draft submitted under_review needs_revision approved published rejected expired cancelled }
enum ActiveStatus      { active inactive }

enum DealerVerificationStatus { official_dealer verified_partner premium_partner pending rejected expired }
enum DealerService           { test_drive trade_in financing delivery warranty }

enum LeadState {
  draft submitted dealer_opened official_offer test_drive_requested
  test_drive_confirmed whatsapp_handoff expired no_response second_offer
  accepted closed
}
enum LeadSourceSurface { car_detail catalog compare dealer_profile content decision_center }
enum LeadActor         { user internal_operator system }
enum PreferredContact  { phone whatsapp }
enum LeadTimelineEventType {
  lead_draft_created lead_submitted lead_dealer_opened lead_official_offer_received
  test_drive_requested test_drive_confirmed whatsapp_handoff_created offer_expired
  lead_no_response second_offer_requested offer_accepted lead_closed
}

enum DecisionStatus            { active decided abandoned closed }
enum DecisionHistoryEventType  {
  search viewed_model saved_car comparison_created lead_submitted dealer_replied
  official_offer_received whatsapp_clicked test_drive_requested price_changed
  conflict_detected offer_expired
}

enum ContentType   { news encyclopedia qa_question qa_answer }
enum ContentStatus { draft published unpublished }
enum EncyclopediaCategory { tech battery driving finance charging insurance }

enum AdPackageType {
  verified_dealer_package premium_dealer_profile featured_dealer_placement
  featured_offer sponsored_catalog_card homepage_sponsored_block content_sponsorship
  compare_sponsored_offer qa_sponsored_answer bazar_nebzi_sponsored_question
  qualified_lead_package monthly_dealer_insight_report
}
enum AdPlacementArea {
  homepage catalog car_detail compare dealer_list dealer_detail
  news_detail encyclopedia_detail qa market_pulse
}
enum AdStatus {
  draft submitted under_review invoice_required invoice_sent payment_uploaded
  paid approved active paused expired rejected cancelled
}
enum AdLabel { Sponsorlu Reklam Premium }

enum InvoiceStatus      { pending invoice_sent payment_uploaded paid overdue cancelled }
enum PaymentProofStatus { pending_review approved rejected }

enum BazarCadence      { daily weekly monthly }
enum BazarTopicStatus  { draft sponsored_pending_approval active closed resolved archived rejected }

enum PointAction { bazar_vote qa_question qa_answer_approved comparison verified_lead_submit encyclopedia_read news_read }
enum BadgeId     { first_comparison market_observer encyclopedia_reader qa_participant official_offer_received }

enum AdminRole       { super_admin internal_ops_admin content_manager sales_lead_manager moderator }
enum SubmissionKind  { profile_edit offer_create offer_update media }
enum SubmissionStatus{ draft submitted under_review needs_revision approved published rejected expired cancelled }

enum AuditActorType  { admin dealer system }
enum OtpPurpose      { lead_submit whatsapp_handoff profile_access }
enum InitiatedBy     { dealer admin }

// ===========================================================================
//  CATALOG
// ===========================================================================

model Brand {
  brand_id   String        @id                 // e.g. "byd"
  name       String
  country    String?
  status     ActiveStatus  @default(active)
  created_at DateTime      @default(now()) @db.Timestamptz(6)
  updated_at DateTime      @updatedAt        @db.Timestamptz(6)

  models       Model[]
  generations  Generation[]
  trims        Trim[]

  @@map("brand")
}

model Model {
  model_id   String        @id                 // derived: "${brand_id}__${name_slug}"
  brand_id   String
  name       String                            // "Han", "Camry"
  body_type  String?
  status     ActiveStatus  @default(active)
  created_at DateTime      @default(now()) @db.Timestamptz(6)
  updated_at DateTime      @updatedAt        @db.Timestamptz(6)

  brand Brand @relation(fields: [brand_id], references: [brand_id], onDelete: Restrict)

  @@unique([brand_id, name])
  @@index([brand_id])
  @@map("model")
}

model Generation {
  generation_id        String        @id       // e.g. "g05", "xv80"
  brand_id             String
  model_name           String                  // composite link to Model.(brand_id, name) — see ER doc
  name                 String                  // "G05"
  display_name         String                  // "G05 (2018–)"
  production_year_from Int
  production_year_to   Int?
  status               ActiveStatus  @default(active)
  created_at           DateTime      @default(now()) @db.Timestamptz(6)
  updated_at           DateTime      @updatedAt        @db.Timestamptz(6)

  brand Brand  @relation(fields: [brand_id], references: [brand_id], onDelete: Restrict)
  trims Trim[]

  @@index([brand_id, model_name])
  @@map("generation")
}

model Trim {
  trim_id       String        @id            // canonical vehicle reference
  brand_id      String
  model_name    String
  year          Int
  display_name  String
  energy_type   EnergyType
  body_type     String?
  generation_id String?
  power_hp      Int?
  range_km      Int?
  image_url     String?
  status        ActiveStatus  @default(active)
  created_at    DateTime      @default(now()) @db.Timestamptz(6)
  updated_at    DateTime      @updatedAt        @db.Timestamptz(6)

  brand        Brand           @relation(fields: [brand_id], references: [brand_id], onDelete: Restrict)
  generation   Generation?     @relation(fields: [generation_id], references: [generation_id], onDelete: SetNull)
  spec         TrimSpec?
  catalogPrices CatalogPrice[]
  dealerOffers  DealerOffer[]
  leads         Lead[]
  savedCars     SavedCar[]
  viewedCars    ViewedCar[]

  @@index([brand_id, model_name])
  @@index([generation_id])
  @@index([status])
  @@map("trim")
}

model TrimSpec {
  id             String      @id @default(cuid())
  trim_id        String      @unique
  energy_type    EnergyType
  body_type      String?
  drivetrain     String?
  power_hp       Int?
  range_km       Int?
  battery_kwh    Decimal?    @db.Decimal(6, 2)
  acceleration_s Decimal?    @db.Decimal(4, 2)
  top_speed_kmh  Int?
  created_at     DateTime    @default(now()) @db.Timestamptz(6)
  updated_at     DateTime    @updatedAt        @db.Timestamptz(6)

  trim Trim @relation(fields: [trim_id], references: [trim_id], onDelete: Cascade)

  @@map("trim_spec")
}

model CatalogPrice {
  catalog_price_id    String              @id @default(cuid())
  trim_id             String
  amount              Decimal             @db.Decimal(12, 2)
  currency            CatalogCurrency
  status              PriceStatus
  source_type         SourceType
  source_name         String
  verification_status VerificationStatus
  last_updated        DateTime            @db.Timestamptz(6)
  created_at          DateTime            @default(now()) @db.Timestamptz(6)
  updated_at          DateTime            @updatedAt        @db.Timestamptz(6)

  trim Trim @relation(fields: [trim_id], references: [trim_id], onDelete: Cascade)

  @@index([trim_id, last_updated(sort: Desc)])
  @@map("catalog_price")
}

model Dealer {
  dealer_id           String                    @id
  legal_name          String
  display_name        String
  verification_status DealerVerificationStatus
  represented_brands  String[]                                 // brand_id[] — JSON array, not a join (read-mostly)
  city                String
  address             String
  working_hours       Json                                      // WorkingHoursRange[]
  response_sla_hours  Int
  services            DealerService[]
  status              ActiveStatus              @default(active)
  source_name         String
  created_at          DateTime                  @default(now()) @db.Timestamptz(6)
  updated_at          DateTime                  @updatedAt        @db.Timestamptz(6)

  offers              DealerOffer[]
  verificationHistory DealerVerificationHistory[]
  invoices            Invoice[]
  paymentProofs       PaymentProof[]
  adRequests          AdRequest[]
  dealerUsers         DealerUser[]

  @@index([verification_status])
  @@index([city])
  @@map("dealer")
}

model DealerOffer {
  offer_id        String           @id          // prefix "off_*"
  trim_id         String
  dealer_id       String
  amount          Decimal          @db.Decimal(12, 2)
  currency        CatalogCurrency
  status          PriceStatus                                  // typically dealer_official_offer | dealer_quote_pending | expired_offer
  stock_status    StockStatus
  source_type     SourceType
  source_name     String
  verification_status VerificationStatus
  offer_status    OfferStatus
  valid_from      DateTime?         @db.Timestamptz(6)
  valid_until     DateTime?         @db.Timestamptz(6)
  included_fees   String[]
  excluded_fees   String[]
  signed_pdf_url  String?
  submitted_by    String?
  reviewed_by     String?
  review_note     String?
  notes           String?
  last_updated    DateTime          @db.Timestamptz(6)
  published_at    DateTime?         @db.Timestamptz(6)
  created_at      DateTime          @default(now()) @db.Timestamptz(6)
  updated_at      DateTime          @updatedAt        @db.Timestamptz(6)

  trim   Trim   @relation(fields: [trim_id], references: [trim_id], onDelete: Restrict)
  dealer Dealer @relation(fields: [dealer_id], references: [dealer_id], onDelete: Restrict)

  @@index([trim_id])
  @@index([dealer_id, offer_status])
  @@index([trim_id, offer_status])                              // partial-published index lives in raw SQL — see "Indexes" section below
  @@map("dealer_offer")
}

model DealerVerificationHistory {
  id          String                    @id @default(cuid())
  dealer_id   String
  from_status DealerVerificationStatus?
  to_status   DealerVerificationStatus
  actor_id    String
  actor_role  String
  note        String?
  created_at  DateTime                  @default(now()) @db.Timestamptz(6)

  dealer Dealer @relation(fields: [dealer_id], references: [dealer_id], onDelete: Cascade)

  @@index([dealer_id, created_at(sort: Desc)])
  @@map("dealer_verification_history")
}

model DealerSubmission {
  submission_id String           @id
  dealer_id     String
  kind          SubmissionKind
  target_id     String?
  payload       Json
  status        SubmissionStatus
  reviewer_id   String?
  review_note   String?
  submitted_by  String
  created_at    DateTime         @default(now()) @db.Timestamptz(6)
  updated_at    DateTime         @updatedAt        @db.Timestamptz(6)
  resolved_at   DateTime?        @db.Timestamptz(6)

  @@index([dealer_id, status])
  @@index([status, created_at])
  @@map("dealer_submission")
}

// ===========================================================================
//  CUSTOMER
// ===========================================================================

model User {
  id           String   @id                                    // "user_${phoneHash.slice(0,16)}"
  phone_hash   String   @unique @db.Citext
  display_name String?
  created_at   DateTime @default(now()) @db.Timestamptz(6)
  updated_at   DateTime @updatedAt        @db.Timestamptz(6)

  otps              OTPVerification[]
  leads             Lead[]
  decisions         Decision[]
  decisionHistory   DecisionHistoryEvent[]
  savedCars         SavedCar[]
  viewedCars        ViewedCar[]
  contentReads      ContentRead[]
  marketPulseVotes  MarketPulseVote[]
  badges            UserBadge[]
  pointGrants       PointGrant[]
  activityEvents    ActivityEvent[]

  @@map("app_user")
}

model OTPVerification {
  id           String     @id                                  // "otp_<uuid>"
  user_id      String?
  phone_hash   String     @db.Citext
  purpose      OtpPurpose
  code_hash    String                                           // never store the raw OTP — store hash
  created_at   DateTime   @default(now()) @db.Timestamptz(6)
  expires_at   DateTime   @db.Timestamptz(6)
  resend_after DateTime   @db.Timestamptz(6)
  attempts     Int        @default(0)
  locked       Boolean    @default(false)
  verified_at  DateTime?  @db.Timestamptz(6)
  lead_id      String?

  user User? @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([phone_hash, purpose])
  @@index([expires_at])
  @@map("otp_verification")
}

model Lead {
  lead_id           String              @id
  trim_id           String
  user_id           String
  phone_hash        String              @db.Citext
  state             LeadState
  source_surface    LeadSourceSurface
  previous_lead_id  String?
  name              String?
  preferred_contact PreferredContact?
  note              String?
  closed_at         DateTime?           @db.Timestamptz(6)
  created_at        DateTime            @default(now()) @db.Timestamptz(6)
  updated_at        DateTime            @updatedAt        @db.Timestamptz(6)

  user           User              @relation(fields: [user_id], references: [id], onDelete: Restrict)
  trim           Trim              @relation(fields: [trim_id], references: [trim_id], onDelete: Restrict)
  previousLead   Lead?             @relation("LeadChain", fields: [previous_lead_id], references: [lead_id], onDelete: SetNull)
  nextLeads      Lead[]            @relation("LeadChain")
  events         LeadEvent[]

  @@index([user_id, created_at(sort: Desc)])
  @@index([state])
  @@index([trim_id])
  @@map("lead")
}

model LeadEvent {
  event_id   String                  @id                       // "lev_<uuid>"
  lead_id    String
  type       LeadTimelineEventType
  from_state LeadState?
  to_state   LeadState?
  actor      LeadActor
  metadata   Json?
  created_at DateTime                @default(now()) @db.Timestamptz(6)

  lead Lead @relation(fields: [lead_id], references: [lead_id], onDelete: Cascade)

  @@index([lead_id, created_at])
  @@map("lead_event")
}

model Decision {
  decision_id        String          @id
  user_id            String
  title              String
  primary_trim_id    String
  candidate_trim_ids String[]                                  // JSON array — see ER doc ADR
  lead_ids           String[]
  status             DecisionStatus
  note               String?
  decided_at         DateTime?       @db.Timestamptz(6)
  closed_at          DateTime?       @db.Timestamptz(6)
  abandoned_at       DateTime?       @db.Timestamptz(6)
  created_at         DateTime        @default(now()) @db.Timestamptz(6)
  updated_at         DateTime        @updatedAt        @db.Timestamptz(6)

  user    User                   @relation(fields: [user_id], references: [id], onDelete: Restrict)
  history DecisionHistoryEvent[]

  @@index([user_id, status])
  @@index([user_id, updated_at(sort: Desc)])
  @@map("decision")
}

model DecisionHistoryEvent {
  event_id    String                      @id
  user_id     String
  decision_id String?
  type        DecisionHistoryEventType
  trim_id     String?
  lead_id     String?
  dealer_id   String?
  offer_id    String?
  metadata    Json?
  created_at  DateTime                    @default(now()) @db.Timestamptz(6)

  user     User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  decision Decision? @relation(fields: [decision_id], references: [decision_id], onDelete: SetNull)

  @@index([user_id, created_at(sort: Desc)])
  @@index([decision_id, created_at])
  @@map("decision_history_event")
}

model SavedCar {
  saved_id   String   @id
  user_id    String
  trim_id    String
  created_at DateTime @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  trim Trim @relation(fields: [trim_id], references: [trim_id], onDelete: Restrict)

  @@unique([user_id, trim_id])
  @@map("saved_car")
}

model ViewedCar {
  viewed_id String   @id
  user_id   String
  trim_id   String
  viewed_at DateTime @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  trim Trim @relation(fields: [trim_id], references: [trim_id], onDelete: Restrict)

  @@unique([user_id, trim_id])                                  // repository upserts viewed_at
  @@index([user_id, viewed_at(sort: Desc)])
  @@map("viewed_car")
}

// ===========================================================================
//  CONTENT
// ===========================================================================

model News {
  content_id            String        @id                      // "news_<slug>" preserved
  slug                  String        @unique
  title                 String
  summary               String
  body                  String
  related_trim_ids      String[]
  status                ContentStatus @default(draft)
  source_name           String?
  category              String?
  image_url             String?
  image_alt             String?
  excerpt               String?
  related_model_reason  String?
  published_at          DateTime      @db.Timestamptz(6)
  created_at            DateTime      @default(now()) @db.Timestamptz(6)
  updated_at            DateTime      @updatedAt        @db.Timestamptz(6)

  @@index([status, published_at(sort: Desc)])
  @@map("news")
}

model Encyclopedia {
  content_id            String                @id              // "enc_<slug>"
  slug                  String                @unique
  title                 String
  summary               String
  body                  String
  related_trim_ids      String[]
  status                ContentStatus         @default(draft)
  topic_tags            String[]
  category              EncyclopediaCategory?
  stats                 Json?
  source                Json?                                  // EncyclopediaSource
  image_url             String?
  image_alt             String?
  excerpt               String?
  related_model_reason  String?
  published_at          DateTime              @db.Timestamptz(6)
  created_at            DateTime              @default(now()) @db.Timestamptz(6)
  updated_at            DateTime              @updatedAt        @db.Timestamptz(6)

  @@index([status, published_at(sort: Desc)])
  @@map("encyclopedia")
}

model QAQuestion {
  content_id       String        @id                            // "qa_<short_id>"
  short_id         String        @unique
  question         String
  related_trim_ids String[]
  status           ContentStatus @default(draft)
  published_at     DateTime      @db.Timestamptz(6)
  created_at       DateTime      @default(now()) @db.Timestamptz(6)
  updated_at       DateTime      @updatedAt        @db.Timestamptz(6)

  answers QAAnswer[]

  @@index([status, published_at(sort: Desc)])
  @@map("qa_question")
}

model QAAnswer {
  content_id   String        @id
  question_id  String
  body         String
  status       ContentStatus @default(draft)                     // moderation
  published_at DateTime?     @db.Timestamptz(6)
  created_at   DateTime      @default(now()) @db.Timestamptz(6)
  updated_at   DateTime      @updatedAt        @db.Timestamptz(6)

  question QAQuestion @relation(fields: [question_id], references: [content_id], onDelete: Cascade)

  @@index([question_id])
  @@map("qa_answer")
}

model ContentRead {
  id           String      @id @default(cuid())
  user_id      String
  content_type ContentType
  content_id   String                                            // polymorphic; FK not enforced at DB level
  read_at      DateTime    @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, content_type, content_id])
  @@index([content_type, content_id])
  @@map("content_read")
}

// ===========================================================================
//  COMMERCIAL
// ===========================================================================

model AdPackage {
  package_type AdPackageType @id
  display_name String
  description  String?
  price_hint   String?

  adRequests AdRequest[]

  @@map("ad_package")
}

model AdPlacement {
  placement      AdPlacementArea @id
  display_name   String

  adRequests AdRequest[]

  @@map("ad_placement")
}

model AdRequest {
  ad_request_id     String          @id
  dealer_id         String?
  initiated_by      InitiatedBy
  submitted_by      String
  package_type      AdPackageType
  placement         AdPlacementArea
  label             AdLabel?
  status            AdStatus
  campaign_note     String?
  start_date        DateTime?       @db.Date
  end_date          DateTime?       @db.Date
  invoice_id        String?         @unique
  review_note       String?
  rejection_reason  String?
  reviewed_by       String?
  activated_by      String?
  activated_at      DateTime?       @db.Timestamptz(6)
  paused_at         DateTime?       @db.Timestamptz(6)
  expired_at        DateTime?       @db.Timestamptz(6)
  created_at        DateTime        @default(now()) @db.Timestamptz(6)
  updated_at        DateTime        @updatedAt        @db.Timestamptz(6)

  dealer            Dealer?         @relation(fields: [dealer_id], references: [dealer_id], onDelete: Restrict)
  package           AdPackage       @relation(fields: [package_type], references: [package_type], onDelete: Restrict)
  placementRef      AdPlacement     @relation(fields: [placement],   references: [placement],   onDelete: Restrict)
  invoice           Invoice?        @relation("AdRequestInvoice", fields: [invoice_id], references: [invoice_id], onDelete: SetNull)
  marketPulseTopics MarketPulseTopic[]

  @@index([dealer_id, status])
  @@index([status, placement])
  @@map("ad_request")
}

model Invoice {
  invoice_id        String         @id
  invoice_number    String         @unique
  ad_request_id     String         @unique
  dealer_id         String?
  amount            Decimal        @db.Decimal(12, 2)
  currency          InvoiceCurrency
  due_at            DateTime       @db.Date
  status            InvoiceStatus
  payment_proof_id  String?        @unique
  notes             String?
  cancel_reason     String?
  paid_at           DateTime?      @db.Timestamptz(6)
  marked_overdue_at DateTime?      @db.Timestamptz(6)
  created_by        String
  created_at        DateTime       @default(now()) @db.Timestamptz(6)
  updated_at        DateTime       @updatedAt        @db.Timestamptz(6)

  dealer        Dealer?               @relation(fields: [dealer_id], references: [dealer_id], onDelete: Restrict)
  adRequestFromRel  AdRequest?        @relation("AdRequestInvoice")
  paymentProofs PaymentProof[]
  history       PaymentStatusHistory[]

  @@index([dealer_id, status])
  @@index([status, due_at])
  @@map("invoice")
}

model PaymentProof {
  payment_proof_id  String              @id
  invoice_id        String
  dealer_id         String
  reference         String
  file_ref          String?
  uploaded_by       String
  uploaded_at       DateTime            @default(now()) @db.Timestamptz(6)
  proof_note        String?
  status            PaymentProofStatus
  admin_review_note String?
  reviewed_by       String?
  reviewed_at       DateTime?           @db.Timestamptz(6)

  invoice Invoice @relation(fields: [invoice_id], references: [invoice_id], onDelete: Cascade)
  dealer  Dealer  @relation(fields: [dealer_id], references: [dealer_id], onDelete: Restrict)

  @@index([invoice_id, uploaded_at(sort: Desc)])
  @@index([status])
  @@map("payment_proof")
}

model PaymentStatusHistory {
  id          String        @id @default(cuid())
  invoice_id  String
  from_status InvoiceStatus?
  to_status   InvoiceStatus
  actor_id    String
  actor_role  String
  note        String?
  created_at  DateTime      @default(now()) @db.Timestamptz(6)

  invoice Invoice @relation(fields: [invoice_id], references: [invoice_id], onDelete: Cascade)

  @@index([invoice_id, created_at(sort: Desc)])
  @@map("payment_status_history")
}

// ===========================================================================
//  COMMUNITY — Bazar Nəbzi
// ===========================================================================

model MarketPulseTopic {
  topic_id               String           @id                  // "bz_<uuid>"
  question               String
  cadence                BazarCadence
  status                 BazarTopicStatus
  start_date             DateTime         @db.Date
  end_date               DateTime         @db.Date
  sponsored              Boolean          @default(false)
  sponsor_ad_request_id  String?
  sponsor_name           String?
  market_summary         String?
  rejection_reason       String?
  created_by             String
  created_at             DateTime         @default(now()) @db.Timestamptz(6)
  updated_at             DateTime         @updatedAt        @db.Timestamptz(6)
  closed_at              DateTime?        @db.Timestamptz(6)
  resolved_at            DateTime?        @db.Timestamptz(6)
  archived_at            DateTime?        @db.Timestamptz(6)

  sponsorAdRequest AdRequest?              @relation(fields: [sponsor_ad_request_id], references: [ad_request_id], onDelete: SetNull)
  options          MarketPulseOption[]
  votes            MarketPulseVote[]
  snapshots        MarketPulseSnapshot[]

  @@index([status, start_date])
  @@index([cadence, status])
  @@map("market_pulse_topic")
}

model MarketPulseOption {
  option_id String @id
  topic_id  String
  label     String
  position  Int    @default(0)

  topic MarketPulseTopic @relation(fields: [topic_id], references: [topic_id], onDelete: Cascade)
  votes MarketPulseVote[]

  @@index([topic_id])
  @@map("market_pulse_option")
}

model MarketPulseVote {
  vote_id      String   @id
  topic_id     String
  option_id    String
  user_id      String
  invalidated  Boolean  @default(false)
  created_at   DateTime @default(now()) @db.Timestamptz(6)

  topic  MarketPulseTopic  @relation(fields: [topic_id], references: [topic_id], onDelete: Cascade)
  option MarketPulseOption @relation(fields: [option_id], references: [option_id], onDelete: Restrict)
  user   User              @relation(fields: [user_id], references: [id], onDelete: Restrict)

  @@unique([topic_id, user_id])                                 // one vote per user per topic
  @@index([topic_id])
  @@map("market_pulse_vote")
}

model MarketPulseSnapshot {
  id           String   @id @default(cuid())
  topic_id     String
  total_votes  Int
  aggregate    Json                                              // [{option_id, label, count, pct}, ...]
  snapshot_at  DateTime @default(now()) @db.Timestamptz(6)

  topic MarketPulseTopic @relation(fields: [topic_id], references: [topic_id], onDelete: Cascade)

  @@index([topic_id, snapshot_at(sort: Desc)])
  @@map("market_pulse_snapshot")
}

// ===========================================================================
//  GAMIFICATION
// ===========================================================================

model UserBadge {
  badge_grant_id String   @id                                   // "bdg_<uuid>"
  user_id        String
  badge_id       BadgeId
  granted_at     DateTime @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, badge_id])
  @@map("user_badge")
}

model PointGrant {
  point_grant_id String      @id                                // "pg_<uuid>"
  user_id        String
  action         PointAction
  points         Int
  metadata       Json        @default("{}")
  granted_at     DateTime    @default(now()) @db.Timestamptz(6)
  reversed_at    DateTime?   @db.Timestamptz(6)
  reverse_reason String?

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, granted_at(sort: Desc)])
  @@index([user_id, action, granted_at])                         // daily-cap query path
  @@map("point_grant")
}

model ActivityEvent {
  id         String   @id @default(cuid())
  user_id    String
  kind       String                                              // ActivityItem.kind — kept as string (read-side view)
  label      String
  detail     String?
  metadata   Json     @default("{}")
  created_at DateTime @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, created_at(sort: Desc)])
  @@map("activity_event")
}

// ===========================================================================
//  OPERATIONS
// ===========================================================================

model AdminUser {
  admin_id   String   @id                                       // "adm_<slug>"
  name       String
  email      String?  @unique
  role       AdminRole                                          // kept for backwards-compat with current single-role code path
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @updatedAt        @db.Timestamptz(6)

  userRoles AdminUserRole[]

  @@map("admin_user")
}

model Role {
  role_id     String    @id @default(cuid())
  key         AdminRole @unique
  display_name String
  description String?

  userRoles AdminUserRole[]

  @@map("role")
}

model AdminUserRole {
  id        String   @id @default(cuid())
  admin_id  String
  role_id   String
  granted_at DateTime @default(now()) @db.Timestamptz(6)

  admin AdminUser @relation(fields: [admin_id], references: [admin_id], onDelete: Cascade)
  role  Role      @relation(fields: [role_id],  references: [role_id],  onDelete: Restrict)

  @@unique([admin_id, role_id])
  @@map("admin_user_role")
}

model DealerUser {
  id           String   @id @default(cuid())
  dealer_id    String
  contact_name String
  email        String?  @unique
  role         String   @default("dealer_admin")                // future: enum
  created_at   DateTime @default(now()) @db.Timestamptz(6)
  updated_at   DateTime @updatedAt        @db.Timestamptz(6)

  dealer Dealer @relation(fields: [dealer_id], references: [dealer_id], onDelete: Cascade)

  @@index([dealer_id])
  @@map("dealer_user")
}

model AuditLog {
  audit_id    String          @id                              // "audit_<uuid>"
  actor_type  AuditActorType
  actor_id    String
  role        String
  action      String                                            // see ENUMS doc — kept as string because the enum is open-ended and includes values like "point.grant" that map to non-entity rows
  entity_type String
  entity_id   String
  before      Json?
  after       Json?
  note        String?
  created_at  DateTime        @default(now()) @db.Timestamptz(6)

  @@index([entity_type, entity_id, created_at(sort: Desc)])
  @@index([actor_type, actor_id, created_at(sort: Desc)])
  @@index([action, created_at(sort: Desc)])
  @@map("audit_log")
}
```

---

## Indexes — raw SQL additions

Prisma cannot express partial indexes inline. Sprint 9B step 1 commits a follow-up SQL migration with:

```sql
-- Hot path: public catalog reads only published offers.
CREATE INDEX dealer_offer_published_idx
  ON dealer_offer (trim_id, last_updated DESC)
  WHERE offer_status = 'published';

-- Hot path: active Bazar topics.
CREATE INDEX market_pulse_topic_active_idx
  ON market_pulse_topic (end_date)
  WHERE status = 'active';

-- Hot path: pending payment proofs awaiting admin review.
CREATE INDEX payment_proof_pending_idx
  ON payment_proof (uploaded_at)
  WHERE status = 'pending_review';

-- Hot path: pending submissions awaiting admin review.
CREATE INDEX dealer_submission_pending_idx
  ON dealer_submission (created_at)
  WHERE status IN ('submitted', 'under_review', 'needs_revision');

-- Hot path: open leads for a user.
CREATE INDEX lead_open_idx
  ON lead (user_id, created_at DESC)
  WHERE state NOT IN ('closed', 'expired', 'no_response');

-- OTP cleanup job.
CREATE INDEX otp_verification_expired_idx
  ON otp_verification (expires_at)
  WHERE verified_at IS NULL;
```

---

## Coverage check (used by [PRODUCTION_DATA_ARCHITECTURE.md](PRODUCTION_DATA_ARCHITECTURE.md) verification)

Every entity in this draft is present in [ENTITY_RELATIONSHIP_MAP.md](ENTITY_RELATIONSHIP_MAP.md):

`Brand`, `Model`, `Generation`, `Trim`, `TrimSpec`, `CatalogPrice`, `Dealer`, `DealerOffer`, `DealerVerificationHistory`, `DealerSubmission`, `User`, `OTPVerification`, `Lead`, `LeadEvent`, `Decision`, `DecisionHistoryEvent`, `SavedCar`, `ViewedCar`, `News`, `Encyclopedia`, `QAQuestion`, `QAAnswer`, `ContentRead`, `AdPackage`, `AdPlacement`, `AdRequest`, `Invoice`, `PaymentProof`, `PaymentStatusHistory`, `MarketPulseTopic`, `MarketPulseOption`, `MarketPulseVote`, `MarketPulseSnapshot`, `UserBadge`, `PointGrant`, `ActivityEvent`, `AdminUser`, `Role`, `AdminUserRole`, `DealerUser`, `AuditLog`.

40 tables. `CompareSession` is intentionally absent (stays in localStorage, per [PRODUCTION_DATA_ARCHITECTURE.md](PRODUCTION_DATA_ARCHITECTURE.md) §4).

---

## Future schema (addendum — not in initial migration)

The Prisma block above is the schema that Sprint 9B step 1 commits. **Two future addendums** introduce additional tables in later sprints; they are documented separately and are **not** included in the 9B initial migration:

- [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) (Sprint 9E) — adds: `VinCheckRequest`, `VinCheckResult`, `VinCheckProvider`, `VinCheckQuota`, `VinCheckCredit`, `VinCheckCache`. Adds enums: `VinCheckStatus`, `VinReportType`, `VinRiskLevel`, `VinRiskFlag`, `QuotaSource`. No existing column is altered.
- [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md) (Sprint 9F) — adds: `Locale`, `TranslationKey`, `ContentTranslation`, `CarSpecTranslation`, `SeoMetadataTranslation`, `UserLanguagePreference`, `AdminTranslationWorkflow`. No new Prisma enums (statuses live as `String` with TS unions, mirroring `AuditAction`). **No existing table is altered.**

The full Prisma blocks for these future tables are intentionally **not** pasted here — they will be authored in the migration PR for their respective sprint, with this addendum as the source of truth.
