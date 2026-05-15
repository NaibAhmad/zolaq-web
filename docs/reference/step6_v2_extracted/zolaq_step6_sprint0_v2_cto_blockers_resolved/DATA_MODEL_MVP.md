# DATA_MODEL_MVP.md

## Core rule

`trim_id` is the canonical vehicle reference across backend, API, database, tracking and decisions.

`car_id` may appear in frontend routes as a UI alias, but must map to `trim_id`.

## Entities

### Brand

| Field | Type | Required | Notes |
|---|---:|---:|---|
| brand_id | string | yes | UUID or slug-safe ID |
| name | string | yes | BYD, Volvo |
| country | string | no | Origin |
| logo_url | string | no | Optional |
| status | enum | yes | active/inactive |

### Model

| Field | Type | Required | Notes |
|---|---:|---:|---|
| model_id | string | yes | UUID |
| brand_id | string | yes | ref Brand |
| name | string | yes | Han, XC60 |
| body_type | enum | no | sedan/suv/mpv/etc |
| status | enum | yes | active/inactive |

### Year

| Field | Type | Required | Notes |
|---|---:|---:|---|
| year_id | string | yes | UUID |
| model_id | string | yes | ref Model |
| year | integer | yes | 2025/2026 |

### Trim

| Field | Type | Required | Notes |
|---|---:|---:|---|
| trim_id | string | yes | Canonical vehicle reference |
| year_id | string | yes | ref Year |
| display_name | string | yes | BYD Han EV Premium AWD |
| energy_type | enum | yes | EV/PHEV/EREV/HEV/ICE |
| drivetrain | string | no | AWD/RWD/FWD |
| battery_kwh | number | no | EV/PHEV/EREV |
| range_km | number | no | WLTP/CLTC source required |
| engine_l | number | no | ICE/HEV/PHEV/EREV |
| power_hp | number | no | Max power |
| dimensions_mm | object | no | l/w/h |
| image_urls | string[] | no | fallback allowed |
| status | enum | yes | active/inactive |

### CatalogPrice

General/catalog/estimated price attached to trim. Not a dealer-specific offer.

| Field | Type | Required | Notes |
|---|---:|---:|---|
| catalog_price_id | string | yes | UUID |
| trim_id | string | yes | ref Trim |
| amount | number | yes | Numeric amount |
| currency | enum | yes | AZN/USD/CNY |
| status | enum | yes | estimated/catalog_price/price_unknown/conflict/not_available |
| source_type | enum | yes | catalog/estimate/aggregation/zolaq_manual/imported |
| source_name | string | yes | UI visible |
| source_url | string | no | Optional |
| verification_status | enum | yes | unverified/verified/conflict/outdated |
| last_updated | datetime | yes | Required |
| valid_from | datetime | no | Optional |
| valid_until | datetime | no | Optional for catalog; required only if temporary |
| confidence | number | no | 0–100 |
| data_quality_score | number | no | 0–100 |

### Dealer

| Field | Type | Required | Notes |
|---|---:|---:|---|
| dealer_id | string | yes | UUID |
| legal_name | string | yes | Legal company name |
| display_name | string | yes | UI name |
| voen | string | no | Verification SOP |
| verification_status | enum | yes | official_dealer/verified_partner/pending/rejected/expired |
| verification_documents | object[] | no | doc_type, url, expires_at |
| verified_at | datetime | no | Required when verified |
| verified_by | string | no | internal user id |
| verification_expiry | datetime | no | Optional |
| verified_brands | string[] | yes | brand refs |
| city | string | yes | Baku, Sumqayit... |
| address | string | yes | Showroom address |
| working_hours | object | yes | Required for active dealer |
| contact_channels | enum[] | yes | zolaq_inbox/whatsapp/phone_hidden |
| response_sla_hours | number | yes | default 2 |
| status | enum | yes | active/inactive |

### DealerOfferData

Specific dealer offer. Separate from CatalogPrice.

| Field | Type | Required | Notes |
|---|---:|---:|---|
| offer_id | string | yes | UUID |
| trim_id | string | yes | ref Trim |
| dealer_id | string | yes | ref Dealer |
| amount | number | yes | Numeric amount |
| currency | enum | yes | AZN/USD/CNY |
| status | enum | yes | dealer_quote_pending/dealer_official_offer/expired_offer/not_available/conflict |
| stock_status | enum | yes | available/order/not_available/coming_soon |
| source_type | enum | yes | official_dealer/partner/zolaq_manual |
| source_name | string | yes | UI visible |
| verification_status | enum | yes | verified/pending/conflict/outdated |
| last_updated | datetime | yes | Required |
| valid_from | datetime | yes | Required |
| valid_until | datetime | yes | Required for official offer |
| included_fees | string[] | yes | e.g. VAT, DYP, delivery |
| excluded_fees | string[] | yes | if none, empty list |
| signed_pdf_url | string | no | Optional MVP |
| created_by_internal_user_id | string | yes | audit |
| updated_by_internal_user_id | string | yes | audit |
| audit_log_id | string | no | ref AuditLog |

### LeadInquiry / Sorğu

| Field | Type | Required | Notes |
|---|---:|---:|---|
| lead_id | string | yes | L-XXXX format allowed |
| user_id | string | no | nullable before OTP/account |
| trim_id | string | yes | ref Trim |
| dealer_id | string | no | nullable if dealer not chosen |
| offer_id | string | no | ref DealerOfferData after offer |
| state | enum | yes | LeadState |
| form_payload | object | yes | budget/payment/color/trade-in/note |
| created_from_surface | enum | yes | car_detail/catalog/compare/dealer_profile/content/decision_center |
| phone_hash | string | yes | SHA-256 + env salt |
| raw_phone_encrypted | string | yes | encrypted at rest |
| otp_verified_at | datetime | no | required before status access |
| utm_source | string | no | marketing |
| utm_medium | string | no | marketing |
| utm_campaign | string | no | marketing |
| test_drive | object | no | date_pref, time_pref, status |
| whatsapp_handoff | object | no | clicked_at, opened_at, prefill_hash |
| events | object[] | yes | timeline/audit |
| phone_visible_to_dealer | boolean | yes | default false |
| created_at | datetime | yes | |
| updated_at | datetime | yes | |

### Decision / Qərar

| Field | Type | Required | Notes |
|---|---:|---:|---|
| decision_id | string | yes | D-XXX format allowed |
| user_id | string | yes | ref User |
| title | string | yes | e.g. Ailə sedan vs PHEV |
| candidates | string[] | yes | trim_id[] 2–3 models |
| linked_leads | string[] | no | lead_id[] |
| linked_offers | string[] | no | offer_id[] |
| readiness_score | number | yes | backend computed |
| score_breakdown | object | yes | components |
| next_best_action | object | yes | CTA instruction |
| status | enum | yes | active/decided/abandoned/closed |
| decided_trim_id | string | no | when decided |
| created_at | datetime | yes | |
| updated_at | datetime | yes | |

### DecisionHistoryEvent

| Field | Type | Required | Notes |
|---|---:|---:|---|
| event_id | string | yes | UUID |
| user_id | string | yes | ref User |
| decision_id | string | no | Optional |
| event_type | enum | yes | search/view/save/compare/lead/offer/whatsapp/test_drive/price_change/conflict |
| trim_id | string | no | Optional |
| lead_id | string | no | Optional |
| offer_id | string | no | Optional |
| metadata | object | no | PII-safe |
| created_at | datetime | yes | |

### ContentArticle

| Field | Type | Required | Notes |
|---|---:|---:|---|
| content_id | string | yes | UUID |
| type | enum | yes | news |
| slug | string | yes | Unique |
| title | string | yes | AZ UI |
| summary | string | yes | |
| body | string | yes | markdown/html |
| related_trim_ids | string[] | no | content-to-lead flow |
| status | enum | yes | draft/published/archived |
| source_name | string | no | optional |
| published_at | datetime | no | |

### EncyclopediaEntry

Same as ContentArticle but `type = encyclopedia`; may include `topic_tags`.

### QAQuestion / QAAnswer

| Field | Type | Required | Notes |
|---|---:|---:|---|
| qa_id | string | yes | UUID |
| question | string | yes | |
| answer | string | yes | expert answer |
| related_trim_ids | string[] | no | |
| status | enum | yes | draft/published/archived |
| created_at | datetime | yes | |

### OTPAttempt

| Field | Type | Required | Notes |
|---|---:|---:|---|
| otp_id | string | yes | UUID |
| phone_hash | string | yes | SHA-256 + per-env salt |
| purpose | enum | yes | lead_submit/whatsapp_handoff/profile_access |
| code_hash | string | yes | never store raw OTP |
| expires_at | datetime | yes | 5 minutes |
| attempts | integer | yes | max 3 |
| resend_count | integer | yes | rate limited |
| verified_at | datetime | no | |
| created_at | datetime | yes | |

### AuditLog

| Field | Type | Required | Notes |
|---|---:|---:|---|
| audit_log_id | string | yes | UUID |
| actor_id | string | yes | internal user/system |
| actor_type | enum | yes | internal_user/system |
| action | string | yes | |
| entity_type | string | yes | dealer/offer/lead/catalog_price/content |
| entity_id | string | yes | |
| before | object | no | diff |
| after | object | no | diff |
| created_at | datetime | yes | |
