# QA_ACCEPTANCE_CRITERIA.md

## Routes

- All final public routes open.
- Protected profile routes require OTP/session.
- Owner-only lead and decision routes return 403 for non-owner.
- `/encyclopedia` is used instead of `/wiki`.

## OTP

- OTP request works.
- OTP expires after 5 minutes.
- Wrong OTP fails.
- Wrong OTP 3 attempts locks session.
- Resend cooldown prevents immediate resend.
- Rate limit prevents more than 3 OTP/hour per phone.
- Unverified draft lead expires after 24 hours.

## Lead state transitions

- draft → submitted
- submitted → dealer_opened
- submitted → no_response
- dealer_opened → official_offer
- official_offer → expired
- official_offer → test_drive_requested
- test_drive_requested → test_drive_confirmed
- no_response → second_offer
- any problem status → second_offer
- accepted → closed

## Privacy

- Raw phone never goes to analytics.
- phone_hash is used in events where required.
- Phone is not visible to dealer in MVP.
- Non-owner user gets 403 on lead detail.

## Price

- All 8 price statuses render correctly.
- Currency is shown on every price card.
- Format is `89 500 AZN`.
- Expired offer shows expired state/strikethrough.
- Conflict warning appears for conflict status.
- Dealer offers show valid_until.
- PDF button hidden when signed_pdf_url is null.

## Internal ops

- Dealer verification update creates audit log.
- Offer valid_until update creates audit log.
- Lead state update creates timeline event and audit log.
- Content publish/archive creates audit log.

## Tracking

- Event names are snake_case.
- Global payload includes session_id, device_type, language and source_url.
- PII is not sent.
- related_model_clicked fires from content pages.

## Decision Center

- readiness_score comes from backend.
- Frontend does not calculate readiness_score.
- score_breakdown is visible or available in API payload.
- next_best_action is returned and clickable.
