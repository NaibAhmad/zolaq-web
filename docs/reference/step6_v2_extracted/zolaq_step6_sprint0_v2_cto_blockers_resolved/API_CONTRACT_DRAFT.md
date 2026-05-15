# API_CONTRACT_DRAFT.md

## Global rules

- Base path: `/api`
- Auth: session or token after OTP verification.
- Private profile routes require owner access.
- Internal endpoints require internal role.
- All error responses use the standard error envelope.
- Tracking payloads must be PII-safe.

## Standard error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Auth / OTP

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/otp/request` | Request OTP |
| POST | `/api/auth/otp/verify` | Verify OTP |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user/session |

### POST /api/auth/otp/request

Request:
```json
{
  "phone": "+994501234567",
  "purpose": "lead_submit",
  "lead_id": "L-2208"
}
```

Response:
```json
{
  "otp_session_id": "otp_001",
  "expires_in_seconds": 300,
  "resend_after_seconds": 60
}
```

### POST /api/auth/otp/verify

Request:
```json
{
  "otp_session_id": "otp_001",
  "code": "123456"
}
```

Response:
```json
{
  "verified": true,
  "user_id": "user_001",
  "lead_id": "L-2208"
}
```

## Cars / Trims

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/cars` | Catalog trims |
| GET | `/api/cars/{trim_id}` | Car/trim detail |
| GET | `/api/cars/{trim_id}/related` | Related trims/content |
| GET | `/api/cars/{trim_id}/prices` | CatalogPrice list |
| GET | `/api/cars/{trim_id}/dealer-offers` | Dealer offers |

## Catalog prices

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/catalog-prices?trim_id=` | Catalog prices |
| POST | `/api/internal/catalog-prices` | Create catalog price |
| PATCH | `/api/internal/catalog-prices/{price_id}` | Update catalog price |

## Dealers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dealers` | Dealer listing |
| GET | `/api/dealers/{dealer_id}` | Dealer detail |
| GET | `/api/dealers/{dealer_id}/offers` | Dealer offers |
| GET | `/api/dealers/{dealer_id}/profile` | Public profile payload |

## Dealer offers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/offers/{offer_id}` | Offer detail |
| POST | `/api/internal/offers` | Create offer |
| PATCH | `/api/internal/offers/{offer_id}` | Update offer |
| POST | `/api/internal/offers/{offer_id}/expire` | Expire offer |

## Leads / Sorğular

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/leads` | Create lead draft/submitted |
| GET | `/api/profile/leads` | User lead list |
| GET | `/api/profile/leads/{lead_id}` | Lead detail |
| PATCH | `/api/internal/leads/{lead_id}/state` | Internal state transition |
| POST | `/api/profile/leads/{lead_id}/request-second-offer` | Create linked second-offer lead |
| POST | `/api/profile/leads/{lead_id}/request-test-drive` | Request test-drive |
| POST | `/api/profile/leads/{lead_id}/whatsapp-handoff` | Track WhatsApp external handoff |
| POST | `/api/profile/leads/{lead_id}/close` | Close lead |

### POST /api/leads

Request:
```json
{
  "trim_id": "trim_byd_han_ev_premium_awd_2025",
  "dealer_id": "dealer_premium_auto_baku",
  "created_from_surface": "car_detail",
  "form_payload": {
    "budget_min": 80000,
    "budget_max": 95000,
    "payment_type": "30% ilkin + 36 ay kredit",
    "preferred_color": "Crystal White / Atlas Grey",
    "trade_in": false,
    "note": "Şənbə test-sürüş mümkündür?"
  },
  "phone": "+994501234567"
}
```

Response:
```json
{
  "lead_id": "L-2208",
  "state": "draft",
  "requires_otp": true,
  "otp_purpose": "lead_submit"
}
```

## Decisions

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/profile/decisions` | Decision list |
| POST | `/api/profile/decisions` | Create decision |
| GET | `/api/profile/decisions/{decision_id}` | Decision Workspace |
| PATCH | `/api/profile/decisions/{decision_id}` | Update decision |
| POST | `/api/profile/decisions/{decision_id}/close` | Close decision |
| GET | `/api/profile/decision-center` | Decision Center dashboard |
| GET | `/api/profile/history` | Decision History |
| GET | `/api/profile/saved` | Saved trims |
| GET | `/api/profile/viewed` | Viewed trims |

## Content

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/news` | News list |
| GET | `/api/news/{slug}` | News detail |
| GET | `/api/encyclopedia` | Encyclopedia list |
| GET | `/api/encyclopedia/{slug}` | Encyclopedia detail |
| GET | `/api/qa` | Q&A list |
| GET | `/api/qa/{id}` | Q&A detail |
| POST | `/api/internal/content` | Create content |
| PATCH | `/api/internal/content/{content_id}` | Update content |

## Tracking

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/events` | Track PII-safe event |

Event request:
```json
{
  "event_name": "car_detail_viewed",
  "session_id": "sess_001",
  "device_type": "mobile",
  "language": "az",
  "source_url": "/cars/trim_byd_han_ev_premium_awd_2025",
  "payload": {
    "trim_id": "trim_byd_han_ev_premium_awd_2025"
  }
}
```

## Internal data/admin operations

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/internal/brands` | Create brand |
| PATCH | `/api/internal/brands/{brand_id}` | Update brand |
| POST | `/api/internal/models` | Create model |
| PATCH | `/api/internal/models/{model_id}` | Update model |
| POST | `/api/internal/trims` | Create trim |
| PATCH | `/api/internal/trims/{trim_id}` | Update trim |
| POST | `/api/internal/dealers` | Create dealer |
| PATCH | `/api/internal/dealers/{dealer_id}` | Update dealer |
| POST | `/api/internal/dealers/{dealer_id}/verify` | Verify dealer |
| POST | `/api/internal/import/mock-seed` | Import mock seed |
| GET | `/api/internal/audit-log` | Audit logs |
