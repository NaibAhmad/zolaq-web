# Sprint 1–6 — MVP QA Checklist

End-to-end manual + automated QA before MVP cut. Acceptance criteria are
sourced from `docs/reference/.../QA_ACCEPTANCE_CRITERIA.md`. Tick each item
after verifying on the running dev server.

## Build / lint / type

- [ ] `npm run lint` passes (no errors)
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run build` passes (production build succeeds)
- [ ] No unused dependencies, no `console.log` of PII

## Routes

- [ ] `/` home loads
- [ ] `/cars` catalog loads
- [ ] `/cars/{trim_id}` car detail loads (any seeded trim)
- [ ] `/compare` placeholder loads
- [ ] `/dealers` dealer listing loads
- [ ] `/dealers/{dealer_id}` dealer profile loads
- [ ] `/news` lists 2 articles
- [ ] `/news/{slug}` detail renders + related model card visible
- [ ] `/encyclopedia` lists 2 entries
- [ ] `/encyclopedia/{slug}` detail renders + related model card visible
- [ ] `/qa` lists 2 questions
- [ ] `/qa/{id}` detail renders + related model card visible
- [ ] `/profile`, `/profile/history`, `/profile/saved`, `/profile/viewed`,
      `/profile/leads`, `/profile/decisions` all load when authenticated
- [ ] Unauthenticated visit to `/profile/*` bounces to `/auth/otp` with
      `purpose=profile_access` and `next=…`
- [ ] `/encyclopedia` is used (not `/wiki`)

## Auth / OTP

- [ ] `POST /api/auth/otp/request` returns `otp_session_id`
- [ ] `POST /api/auth/otp/verify` with correct code → session cookie set
- [ ] Wrong OTP fails (`VALIDATION_ERROR`)
- [ ] 3 wrong OTP attempts locks the session (`LOCKED`)
- [ ] Resend before cooldown returns `RATE_LIMITED`
- [ ] OTP expires after 5 minutes
- [ ] Logout clears session cookie
- [ ] Owner-only routes return 403 for non-owner

## Catalog

- [ ] `/cars` shows seeded trims
- [ ] Filter by brand returns matching subset
- [ ] Filter by `energy_type` works
- [ ] Filter by `year` works
- [ ] Search `q` matches `display_name`
- [ ] Unknown `energy_type` value returns empty list (not error)
- [ ] Invalid `year` returns 400 `VALIDATION_ERROR`

## Car detail

- [ ] All 8 price statuses render with correct label and color tone
- [ ] Currency is shown on every price card (`AZN`/`USD`/`CNY`)
- [ ] Format example: `89 500 AZN`
- [ ] Expired offer shows expired styling
- [ ] Conflict status shows danger tone
- [ ] Dealer offers show `valid_until`
- [ ] PDF button hidden when `signed_pdf_url` is null
- [ ] `?source=catalog|content|dealer_profile|...` propagates to lead form

## Lead flow

- [ ] `draft → submitted` after OTP verify
- [ ] `submitted → dealer_opened` via internal patch
- [ ] `submitted → no_response` after timeout
- [ ] `dealer_opened → official_offer`
- [ ] `official_offer → expired`
- [ ] `official_offer → test_drive_requested`
- [ ] `test_drive_requested → test_drive_confirmed`
- [ ] `no_response → second_offer` via `/request-second-offer`
- [ ] `whatsapp_handoff` transition via `/whatsapp-handoff`
- [ ] `accepted → closed` via `/close`
- [ ] Non-owner gets 403 on `/api/profile/leads/{lead_id}`
- [ ] Unverified draft lead expires after 24 hours

## Dealer profile

- [ ] `/dealers/{id}` shows verification badge
- [ ] Trust summary visible
- [ ] Dealer offers list renders `PriceCard` per offer
- [ ] Pending/rejected/expired badges render correctly

## Decision center

- [ ] `/profile/decisions` lists user's decisions
- [ ] `NewDecisionForm` creates a decision (saved cars → candidates)
- [ ] `/profile/decisions/{id}` workspace shows readiness, NBA, history
- [ ] `readiness_score` is computed backend-side (frontend doesn't recompute)
- [ ] `score_breakdown` is visible/available in payload
- [ ] `next_best_action` is clickable
- [ ] `GET /api/profile/decision-center` returns dashboard summary
- [ ] `GET /api/profile/history` returns event timeline
- [ ] `GET /api/profile/saved` and `/api/profile/viewed` return enriched trims

## Content flow

- [ ] `GET /api/news` returns `{ news: [...] }`
- [ ] `GET /api/news/{slug}` returns `{ article }` or 404 `NOT_FOUND`
- [ ] `GET /api/encyclopedia` returns `{ entries: [...] }`
- [ ] `GET /api/encyclopedia/{slug}` returns `{ entry }` or 404
- [ ] `GET /api/qa` returns `{ qa: [...] }`
- [ ] `GET /api/qa/{id}` returns `{ qa }` or 404
- [ ] Related model card on each content detail navigates to
      `/cars/{trim_id}?source=content`
- [ ] Lead form opened from content page is tagged `source_surface: "content"`

## Tracking

- [ ] All event names are snake_case (verify in `lib/tracking/events.ts`)
- [ ] Global payload always includes `session_id`, `device_type`, `language`,
      `source_url`, `created_at`
- [ ] No raw phone, email, or full name reaches `/api/events`
- [ ] `POST /api/events` with PII key (e.g. `phone`) → 422 with
      `details.banned_keys`
- [ ] `POST /api/events` with unknown `event_name` → 422
- [ ] `POST /api/events` with a valid envelope → 202 `{ accepted: true }`
- [ ] `content_viewed` fires on content detail mount
- [ ] `related_model_clicked` + `cta_clicked` fire on related model link click
- [ ] `car_detail_viewed` fires when `/cars/{id}` data resolves
- [ ] `price_card_viewed` fires per `PriceCard` render
- [ ] `lead_form_opened` fires when modal opens
- [ ] `lead_form_submitted` fires after successful submit (and after post-OTP
      replay)
- [ ] `decision_center_opened` fires on `/profile/decisions` mount
- [ ] `whatsapp_clicked` fires when the WhatsApp lead action is invoked

## Privacy

- [ ] Raw phone never goes to analytics (only `phone_hash` where required)
- [ ] Phone is not visible to dealer in MVP
- [ ] Non-owner gets 403 on lead/decision detail
- [ ] `sessionStorage["zolaq_tsid"]` is a UUID, not a user identifier
