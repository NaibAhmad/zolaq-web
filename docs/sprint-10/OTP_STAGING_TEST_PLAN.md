# Sprint 10 — OTP Staging Test Plan

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Provider during test:** `SMS_PROVIDER=mock`. Codes appear in Vercel server logs as `[MOCK-OTP] phone=… code=…`.

## Goal

Verify the full OTP flow end-to-end on `staging.zolaq.az` without sending a real SMS. Six scenarios cover the happy path and the five most important failure modes.

## Setup

- Operator has Vercel log access (Project → Deployments → current → Functions logs).
- Test phone numbers (any AZ-formatted number is fine; mock provider does not call out).
- A clean browser session (Incognito) for each scenario to avoid cookie carryover.

## Scenario 1 — Valid OTP (happy path)

1. Open `https://staging.zolaq.az/auth/otp` in Incognito.
2. Enter test phone, e.g., `+994501234567`.
3. Submit. Expect: "Code sent" UI, 60-second resend countdown starts.
4. In Vercel logs, find `[MOCK-OTP] phone=… code=NNNNNN`.
5. Enter the 6-digit code in the verify form.
6. Submit. **Expect:** redirected to `/profile`, customer session cookie `zlq_session` set (httpOnly, secure, sameSite=lax).

**Pass criteria:** lands on `/profile`; cookie present; `OtpAttempt` row in DB now marked `consumed_at` set.

## Scenario 2 — Wrong code (attempt counter)

1. Repeat Scenario 1 through step 4 (do not yet submit the code).
2. Submit a **wrong** 6-digit code three times.
3. Each attempt should:
   - Return error "Incorrect code."
   - Increment `attempts` on the `OtpAttempt` row.
4. The 4th attempt with even the correct code is rejected — the OtpAttempt is consumed by max-attempts.
5. UI should now require requesting a fresh code.

**Pass criteria:** 3 wrong attempts allowed; 4th rejects unconditionally; correct code only works after a fresh request.

## Scenario 3 — Expired code

1. Repeat Scenario 1 through step 4.
2. Wait > 5 minutes (the configured OTP TTL).
3. Submit the correct code.
4. **Expect:** error "Code expired. Request a new one."

**Pass criteria:** server returns expired error; `OtpAttempt.expires_at` is in the past; no session issued.

## Scenario 4 — Resend cooldown

1. Open `/auth/otp`, request a code.
2. Immediately click "Resend" before the 60-second countdown completes.
3. **Expect:** UI keeps the resend button disabled; if a request is forced via DevTools, server returns `RESEND_COOLDOWN` (or equivalent) without issuing a new code.

**Pass criteria:** no new `OtpAttempt` row issued within 60 seconds of the previous one for the same phone.

## Scenario 5 — Rate-limit (3 per hour)

1. From a fresh Incognito session, request a code for the same phone number 3 times, waiting 61 seconds between each to bypass the resend cooldown.
2. Attempt a 4th request.
3. **Expect:** server returns `RATE_LIMITED` (or equivalent); no new `OtpAttempt` row created.
4. Wait 1 hour (or query DB to confirm the limit is rolling per hour).
5. After the hour, a new request should succeed.

**Pass criteria:** 4th request in the hour rejected; limit resets after the rolling window.

## Scenario 6 — Cookie tampering

1. Complete Scenario 1 to acquire a valid session cookie.
2. Open DevTools → Application → Cookies → `zlq_session`.
3. Modify any single character of the cookie value and Save.
4. Reload `/profile`.
5. **Expect:** redirected to `/auth/otp` (or similar unauthenticated landing). The tampered cookie's HMAC fails verification and the session is treated as anonymous.
6. Also verify: server-side log notes a signature-verification failure (without leaking the cookie value).

**Pass criteria:** tampered cookie produces an unauthenticated state; no error 500; no PII in logs.

## Additional verifications (passive, during scenarios)

- ✅ Raw phone numbers do **not** appear in any persistent log other than the mock provider's `[MOCK-OTP]` line (which is dev-only and expected to be retired before public launch).
- ✅ `OtpAttempt.phone_hash` is set; raw `phone` column is **not** present in the schema.
- ✅ HTTP error responses are generic and consistent — no leakage of "phone not found" vs "code wrong" timing or wording.

## Sign-off

After all 6 scenarios pass, the operator records the result in the Sprint 10 readiness report:

```
OTP staging smoke: 6/6 pass — 2026-MM-DD — <operator>
```

If any scenario fails, file a P0 in [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md) and do not proceed with broader beta announcement.

## Cross-references

- SMS abstraction: [SMS_PROVIDER_READINESS.md](./SMS_PROVIDER_READINESS.md)
- OTP store: [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts)
- Phone hashing: [lib/auth/phone.ts](../../lib/auth/phone.ts)
- Customer session: [lib/auth/session.ts](../../lib/auth/session.ts)
- Sprint 9F OTP persistence: [docs/sprint-9f/OTP_PERSISTENCE.md](../sprint-9f/OTP_PERSISTENCE.md)
- Security checklist: [SECURITY_PRIVACY_BETA_CHECKLIST.md](./SECURITY_PRIVACY_BETA_CHECKLIST.md)
