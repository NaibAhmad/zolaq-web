# ZOLAQ_STEP_5_FINAL_CORRECTION_BRIEF

## 1. Status

**Zolaq Step 5 — Full Product UI / MVP Screen Composition / Prototype Flow**

Current status: **Strong visual and product direction, but not ready to close.**

Decision: **Step 5 Final Correction phase must be opened.**

Main objective:
- Do not redesign the product.
- Do not create a new visual direction.
- Complete the missing product architecture, user flows, states, routes, CTA hierarchy, terminology, and data logic.

Current visual direction is accepted. The issue is not visual design anymore; the issue is **flow completion and product architecture**.

---

## 2. Product principle

Zolaq is not only a car catalog or listing platform.

Zolaq must work like this:

**Axtar → Öyrən → Müqayisə et → Rəsmi qiymət soruş → Diler cavabını izlə → Başqa təkliflə yoxla → Test-sürüş / WhatsApp → Qərar ver**

Final product logic:

**User → Search / View / Save / Compare → Car / Trim → Dealer Offer → Lead Inquiry → Official Offer → Test-drive / Second Offer / WhatsApp handoff → Decision Center → Next Best Action**

---

## 3. Final product systems

Step 5 must clearly separate and complete these systems:

1. **Discovery System**  
   Homepage, Catalog, Car Detail, Compare, Content-to-car flow.

2. **Dealer System**  
   Official dealer profile, dealer offers, dealer trust, dealer verification.

3. **Lead / Inquiry System**  
   Lead form, OTP, lead status, official offer, no-response, expired offer.

4. **Decision System**  
   Decision Center, Decision Workspace, Decision History, saved cars, saved comparisons.

5. **WhatsApp / Test-drive Support System**  
   External WhatsApp handoff, test-drive request-only, dealer manual confirmation.

---

## 4. Scope freeze

### Must be included in Step 5 Final Correction

- Homepage → Catalog → Car Detail → Compare → Lead
- Lead Form Modal
- Lead Submitted Success State
- Lead Detail / Status Page
- Official Offer Received State
- Offer Expired State
- Dealer No Response State
- Second Offer Request Modal
- Test-drive Request Modal
- Test-drive Confirmed State
- WhatsApp External Handoff State
- Decision Center
- Decision History
- Decision Workspace
- Dealer Profile
- Dealer Offer Detail
- Official Dealers Listing / Directory
- News → Related Model → Lead flow
- Guest → OTP → Lead Status flow

### Must NOT be included in Step 5 Final Correction

- Full dealer self-service dashboard
- Dealer inventory upload panel
- Payment flow
- CRM dashboard
- WhatsApp Business API real chat sync
- Full admin panel pixel-perfect UI
- Private seller flow
- Marketplace seller flow

---

## 5. Route architecture

### Public routes

```text
/                                      Homepage
/cars                                  Catalog listing
/cars/[brand]/[model]/[year]/[trim]    Car detail
/compare                               Compare start / compare builder
/compare/[compareId]                   Saved / active comparison detail
/dealers                               Official dealer listing
/dealers/[dealerSlug]                  Official dealer profile
/dealers/[dealerSlug]/offers/[offerId] Dealer offer detail
/news                                  News listing
/news/[slug]                           News detail
/encyclopedia                          Encyclopedia listing
/encyclopedia/[slug]                   Encyclopedia detail
/qa                                    Q&A listing
/qa/[slug]                             Q&A detail
```

### Private profile routes

```text
/profile                               Decision Center
/profile/history                       Decision History
/profile/saved                         Saved cars
/profile/comparisons                   Saved comparisons
/profile/leads                         Lead / inquiry list
/profile/leads/[leadId]                Private lead detail / status page
/profile/decisions/[decisionId]        Decision Workspace
/profile/settings                      Profile settings / preferences
```

### Auth rule

- Lead detail and Decision Workspace are private.
- Guest can start a lead.
- OTP is required before active lead status is shown.

---

## 6. Decision Center vs Decision History

### Qərar Mərkəzi

Qərar Mərkəzi is the active dashboard. It answers:

**“Mən indi hansı mərhələdəyəm və növbəti nə etməliyəm?”**

Required elements:
- User name
- Qərar hazırlığı: 72/100
- Current decision stage
- Next best action
- Open decisions
- Active inquiries
- Dealer responses
- Saved cars
- Saved comparisons
- Official offers
- Offer expiry warnings
- Compatibility profile
- Recent activity

### Qərar Tarixçəsi

Qərar Tarixçəsi is the activity log. It answers:

**“Mən əvvəl nə etmişdim?”**

Required event types:
- Search
- Viewed model
- Saved car
- Comparison created
- Lead submitted
- Dealer replied
- Official offer received
- WhatsApp clicked
- Test-drive requested
- Price changed
- Conflict detected
- Offer expired

---

## 7. Lead Detail vs Decision Workspace

### Lead Detail

Lead Detail is the status page of one specific inquiry.

Route:

```text
/profile/leads/[leadId]
```

Example:

**BYD Han üçün Premium Auto Baku-ya göndərilmiş qiymət sorğusu**

Must include:
- Lead number
- Model
- Dealer
- Submitted data
- Status timeline
- Price / offer card
- Source / verification
- Valid until
- Next status action
- WhatsApp handoff
- Test-drive request
- Second offer request
- Close inquiry

It answers:

**“Bu konkret sorğunun vəziyyəti nədir?”**

### Decision Workspace

Decision Workspace is the decision work area for one active car-buying decision.

Route:

```text
/profile/decisions/[decisionId]
```

Example:

**BYD Han vs Volvo XC60 qərar prosesi**

Must include:
- Compared models
- Saved models
- Related leads
- Dealer offers
- Official price snapshots
- WhatsApp handoff events
- Test-drive status
- Zolaq recommendation
- Decision readiness score
- Next best action

It answers:

**“Mən hansı maşını seçməyə yaxınam və növbəti addım nədir?”**

---

## 8. Dealer System

### Dealer profile rule

MVP dealer system is only for:
- Official dealer
- Official partner
- Verified seller

Must NOT include:
- Private seller
- Marketplace seller
- Seller dashboard
- Product upload flow
- Dealer self-service inventory panel

### Dealer verification levels

- Level 1 — Təsdiqlənmiş satıcı
- Level 2 — Rəsmi diler · təsdiqlənib
- Level 3 — Premium tərəfdaş

“Rəsmi diler · təsdiqlənib” may only be used after verification of VÖEN, showroom address, brand/distributor agreement or official sales authorization, brand representation, warranty/service conditions, and Zolaq manual review.

### Dealer profile must include

- Dealer name
- Legal name / VÖEN if available
- Official dealer badge
- Verification level
- Represented brands
- Showroom address
- Working hours
- Phone
- WhatsApp
- Average response time
- Lead confirmation rate
- Customer rating
- Active official offers
- Available models
- Services
- Source / verification note
- Dealer trust explanation
- CTA: Rəsmi qiymət istə
- CTA: WhatsApp ilə soruş
- CTA: Test-sürüş sorğusu göndər

### Canonical desktop dealer profile

Canonical desktop dealer profile must be:

**Light data-first layout**

Not:
- Dark marketing hero
- Campaign-style page
- Decorative dealer landing page

Dark hero can be used only for:
- Mobile dealer profile hero
- Premium preview
- Marketing / sponsor showcase

---

## 9. Dealer offer and price logic

`CatalogPrice` and `DealerOfferData` must be separate entities.

### CatalogPrice

- General model price
- Can be estimated, catalog-based or imported
- Used in catalog, car detail, compare
- Not equal to official dealer offer

### DealerOfferData

- Specific dealer offer
- Connected to dealer, model, trim, stock, validity date
- Used in dealer profile, lead, official offer, decision history

### Final price statuses

```text
estimated
catalog_price
dealer_official_offer
dealer_quote_pending
price_unknown
expired_offer
conflict
not_available
```

### UI labels

```text
estimated              → Təxmini qiymət
catalog_price          → Kataloq qiyməti
dealer_official_offer  → Rəsmi diler təklifi
dealer_quote_pending   → Təklif gözlənilir
price_unknown          → Qiymət soruş
expired_offer          → Təklif müddəti bitib
conflict               → Qiymət mənbələrində fərq var
not_available          → Hazırda mövcud deyil
```

### Every price card must show

- Price amount
- Currency
- Price status
- Source type
- Source name
- Verification status
- Last updated
- Valid until — required for dealer offer
- Included fees
- Excluded fees

### Price format

Correct:

```text
89 500 AZN
```

Not allowed:

```text
89,500
89,500 AZN
89500
89 500 without AZN
```

---

## 10. Lead / Inquiry lifecycle

### Main conversion

Primary conversion:

**Qiymət sorğusu / Rəsmi təklif istə**

WhatsApp and test-drive are secondary conversions. Test-drive can become primary only when the user is already close to dealer/model/offer stage.

### Lead status model

```text
draft_unverified
verified_sent_to_dealer
submitted
sent_to_dealer
dealer_viewed
dealer_response_pending
dealer_responded
official_offer_pending
official_offer_sent
offer_expired
test_drive_requested
test_drive_confirmed
second_offer_requested
no_response
closed_by_user
cancelled
```

### Dealer no-response fallback

```text
0–2 hours:
Normal wait state

2 hours:
Soft fallback
CTA: Başqa təkliflə yoxla

6 hours:
Active alternative
CTA: Başqa diler seç / Zolaq tövsiyəsinə bax

24 hours:
No-response status
CTA: Yeni dilerə göndər / Alternativ model təklif al / Sorğunu bağla
```

SLA must be calculated within dealer working hours.

---

## 11. Second offer flow

Do not use the risky wording:

```text
İkinci dilerdən təklif istə
```

Final CTA:

```text
Başqa təkliflə yoxla
```

Modal options:
- Eyni model üçün başqa diler
- Təsdiqlənmiş satıcıdan təklif
- Oxşar model üçün rəsmi təklif
- Daha ucuz alternativ
- Daha premium alternativ

Priority order:
1. Same model, same brand, another official dealer
2. Same model, verified seller / import partner
3. Alternative model from official dealer

---

## 12. Test-drive flow

MVP test-drive is not real booking.

Final decision:

**Test-drive = request-only + dealer manual confirmation**

CTA wording:

```text
Test-sürüş sorğusu göndər
```

Not:

```text
Test-sürüş rezerv et
```

Test-drive request form:
- Name
- Phone
- Model
- Dealer
- Preferred date
- Preferred time range
- Driver license: yes/no
- Note

Statuses:
- Test-sürüş sorğusu göndərildi
- Diler təsdiqi gözlənilir
- Test-sürüş təsdiqləndi
- Alternativ vaxt təklif edildi
- Mümkün deyil

---

## 13. WhatsApp MVP behavior

Final CTO decision:

**WhatsApp = external handoff + tracking**

No WhatsApp Business API in P0.  
No real in-app WhatsApp chat sync in MVP.

Tracked events:
- whatsapp_clicked
- whatsapp_prefill_generated
- whatsapp_external_opened

UI copy:

```text
WhatsApp xarici kanalda davam edir. Zolaq yalnız sorğu statusunu və rəsmi təklif yeniləmələrini tarixçəndə saxlayır.
```

Do not show full WhatsApp-style message bubbles unless clearly marked as mock/demo or post-MVP.

---

## 14. CTA hierarchy

Final rule:

**Each screen can have only one primary CTA.**

### CTA color logic

- Signal Orange: primary conversion only
- Green: WhatsApp
- Blue: navigation, comparison, profile update
- Gray / outline: secondary actions, source, filter, close

### Page-level CTA rules

```text
Homepage:
Primary — Mənə uyğun maşın tap
Secondary — Maşınları müqayisə et

Catalog:
Primary — Müqayisəyə əlavə et / Qiymət soruş
Secondary — Detallara bax

Car detail:
Primary — Qiymət soruş
Secondary — Müqayisə et / WhatsApp

Compare:
Primary — Rəsmi təklif istə
Secondary — Alternativ əlavə et

Dealer profile:
Primary — Rəsmi qiymət istə
Secondary — WhatsApp ilə soruş / Test-sürüş sorğusu göndər

Lead detail:
Primary — status-based next action
Secondary — WhatsApp / Başqa təkliflə yoxla

Decision Center:
Primary — Növbəti addımı tamamla
Secondary — Tarixçəyə bax
```

---

## 15. Terminology dictionary

Final public UI terminology:

```text
Lead → Sorğu
Active lead → Aktiv sorğu
Saved → Saxlanılan
Viewed → Baxılan
Dealer → Diler
Offer → Təklif
Official price → Rəsmi qiymət
Official dealer offer → Rəsmi diler təklifi
Decision score → Qərar hazırlığı
Decision Center → Qərar Mərkəzi
Decision History → Qərar Tarixçəsi
WhatsApp thread → WhatsApp keçidi / WhatsApp müraciəti
Test-drive booking → Test-sürüş sorğusu
Second dealer offer → Başqa təkliflə yoxla
```

Mobile bottom nav final:

```text
Ana
Maşın
Müqayisə
Bələdçi
Mən
```

“Mətn” must not be used.

---

## 16. Decision readiness score

Final name:

```text
Qərar hazırlığı: 72/100
```

Not:

```text
Qərar etibarı
```

Minimum formula:

```text
decision_readiness_score =
profile_score
+ research_score
+ compare_score
+ offer_score
+ test_drive_score
+ budget_match_score
```

Weights:
- Profile completeness — 15%
- Research activity — 15%
- Compare activity — 20%
- Official offers — 25%
- Test-drive stage — 15%
- Budget match — 10%

Score labels:
- 0–30: Hələ araşdırma mərhələsindədir
- 31–60: Seçim formalaşır
- 61–80: Qərara yaxındır
- 81–100: Alış qərarına hazırdır

Tooltip required:

```text
Bu bal profil məlumatların, baxdığın modellər, müqayisələrin, rəsmi diler təklifləri və test-sürüş statusuna əsasən hesablanır.
```

---

## 17. Conflict data behavior

Conflict price should not always fully block recommendation.

Rules:
- Minor conflict: show recommendation + warning
- Medium conflict: show recommendation with low confidence + official offer CTA
- Major conflict: block final verdict and show verification required CTA

Copy example:

```text
Zolaq tövsiyəsi hazır deyil.
Bu model üzrə qiymət mənbələrində ciddi fərq var.
Əvvəl rəsmi təklif alın.
```

CTA:
- Rəsmi qiymət istə
- Başqa təkliflə yoxla

---

## 18. Tracking events — P0 minimum

Final P0 event list:

```text
search_started
search_completed
model_viewed
compare_added
compare_started
zolaq_recommendation_viewed
lead_form_opened
lead_submitted
whatsapp_clicked
dealer_profile_viewed
test_drive_requested
decision_center_opened
saved_model_added
content_viewed
cta_clicked
```

Post-MVP events:

```text
price_alert_created
second_dealer_requested
offer_expired_viewed
qa_question_started
encyclopedia_read
news_read
video_played
profile_completed
dealer_offer_viewed
```

---

## 19. Content-to-lead flow

First test flow:

```text
News → Model → Lead
```

Required flow:

```text
News article → Related model → Car detail → Compare / Qiymət soruş → Lead form
```

Example:

```text
News: 2026 Li Auto L9 təqdim edildi
→ Related model: Li Auto L9
→ Car detail
→ Bakı təhvil qiymətini soruş
→ Lead form
```

Secondary future flows:
- Compare → Lead
- Q&A → Model → Lead
- Encyclopedia → Related Model → Lead
- Video → Model → WhatsApp / Lead

---

## 20. Data entities required for developer handoff

```text
UserProfile
UserPreferenceProfile
UserDecisionProfile
DecisionWorkspace
DecisionHistoryEvent
SavedCar
SavedComparison
CatalogPrice
DealerProfileData
DealerVerificationData
DealerOfferData
OfficialOfferData
LeadInquiryData
LeadStatusTimeline
WhatsAppInteractionData
TestDriveBookingData
PriceSourceSnapshot
DealerScoreData
NotificationPreference
TrackingEvent
```

Minimum relationship:

```text
Brand → Model → Year → Trim
              ↓
        CatalogPrice
              ↓
        DealerOfferData
              ↓
        LeadInquiryData
              ↓
        OfficialOffer / TestDrive / DecisionHistory
```

---

## 21. Acceptance criteria

Step 5 can be closed only if:

1. Homepage → Catalog → Detail → Compare → Lead flow works.
2. Car Detail → Dealer Offer → Lead flow works.
3. Dealer Profile → Official Offer → Lead Status flow works.
4. Lead Detail and Decision Workspace are separate.
5. Decision Center and Decision History are separate.
6. WhatsApp is shown as external handoff.
7. Test-drive is shown as request-only.
8. Price status taxonomy works across all price cards.
9. Source / verification / last_updated / valid_until are visible.
10. Mobile bottom nav uses “Bələdçi”.
11. Public UI uses “Sorğu”, not “Lead”.
12. Each screen has maximum one primary CTA.
13. Guest → OTP → Lead status flow is shown.
14. Dealer no-response / offer expired / conflict states exist.
15. News → Model → Lead flow is shown.

---

## PM final decision

Step 5 Final Correction must start.

This brief is the final source of truth.

Claude task in the next phase:

**Continue the existing prototype without breaking the current visual direction and add only the architecture, flow, state, terminology, and CTA corrections from this brief.**
