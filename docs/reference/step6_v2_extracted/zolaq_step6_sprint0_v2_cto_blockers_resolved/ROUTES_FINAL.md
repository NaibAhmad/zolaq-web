# ROUTES_FINAL.md

## Decision

MVP routes are accepted with one important rule:

- Public route may use `/cars/[carId]`.
- In backend, database, API and analytics, `carId` is an alias for canonical `trim_id`.
- Canonical vehicle reference: `trim_id`.

## Public routes

| Route | Purpose | Notes |
|---|---|---|
| `/` | Homepage | Kəşf / uyğun maşın tap |
| `/cars` | Catalog | Filters, recommendation cards |
| `/cars/[carId]` | Car detail | `carId = trim_id alias` in MVP |
| `/compare?ids=...` | Compare | 2–3 trims |
| `/dealers` | Dealer listing | Official/verified dealers only |
| `/dealers/[dealerId]` | Dealer profile | ID-based in MVP; slug post-MVP |
| `/news` | News listing | Content-to-lead entry |
| `/news/[slug]` | News detail | Related model CTA |
| `/encyclopedia` | Encyclopedia listing | `/wiki` not used in MVP |
| `/encyclopedia/[slug]` | Encyclopedia detail | Related model CTA |
| `/qa` | Q&A listing | Public |
| `/qa/[id]` | Q&A detail | Public |
| `/auth/otp` | OTP verification | Used after lead/WhatsApp/profile access |

## Private/profile routes

| Route | Purpose | Auth |
|---|---|---|
| `/profile` | Decision Center | OTP/session required |
| `/profile/history` | Decision History | OTP/session required |
| `/profile/saved` | Saved cars | OTP/session required |
| `/profile/viewed` | Viewed cars | OTP/session required |
| `/profile/leads` | Lead list | OTP/session required |
| `/profile/leads/[leadId]` | Lead status/detail | Owner-only |
| `/profile/leads/[leadId]/test-drive` | Test-drive status | Owner-only |
| `/profile/leads/[leadId]/whatsapp` | WhatsApp handoff status | Owner-only |
| `/profile/decisions` | Decision list | Owner-only |
| `/profile/decisions/[decisionId]` | Decision Workspace | Owner-only |

## Internal routes/endpoints

No pixel-perfect internal admin UI is part of public MVP. However, internal data operations are required through protected internal endpoints or a minimal internal admin tool.

## Post-MVP SEO aliases

- `/cars/byd/han/2025/ev-premium-awd`
- `/dealers/premium-auto-baku`
