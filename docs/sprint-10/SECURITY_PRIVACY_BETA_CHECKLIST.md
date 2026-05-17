# Sprint 10 — Security & Privacy Beta Checklist

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** verify before announcing beta to testers, and weekly during beta. Pairs with the Sprint 9 baseline at [docs/sprint-9j/SECURITY_QA_CHECKLIST.md](../sprint-9j/SECURITY_QA_CHECKLIST.md).

## 1. No secrets in repo

- [ ] `git grep` for known secret prefixes (`SK_`, `sk_live`, `Bearer `, `BEGIN PRIVATE KEY`) — zero matches.
- [ ] No `.env`, `.env.local`, `.env.production` tracked: `git ls-files | grep -E '^\.env(\.|$)'` → only `.env.example`.
- [ ] No `INITIAL_ADMIN_PASSWORD` value committed anywhere.
- [ ] No `SMS_API_KEY` value committed anywhere.
- [ ] No `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT` values committed.
- [ ] [.gitignore](../../.gitignore) keeps `.env*` ignored with `!.env.example` exception (lines 31–33).

## 2. `.env.example` safety

- [ ] [.env.example](../../.env.example) is tracked.
- [ ] All values are blank or placeholder — no real secrets.
- [ ] Each variable has a comment explaining its purpose and required handling.
- [ ] Sprint 9F-staged variables (`SMS_API_KEY`, `INITIAL_ADMIN_PASSWORD`) are present and blank (not commented out — they're now active in Sprint 9F closure).

## 3. Admin / dealer / customer sessions separate

Verify by inspecting cookies after sign-in to each role:

- [ ] Customer OTP sign-in sets `zlq_session` cookie.
- [ ] Admin password sign-in sets `zlq_admin_session` cookie.
- [ ] Dealer password sign-in sets `zlq_dealer_session` cookie.
- [ ] All three cookies are separate, independently signed, and do not grant cross-role access.
- [ ] Implementation: [lib/auth/session.ts](../../lib/auth/session.ts), [lib/auth/admin-session.ts](../../lib/auth/admin-session.ts), [lib/auth/dealer-session.ts](../../lib/auth/dealer-session.ts).
- [ ] Reference: [docs/sprint-9e/SESSION_COOKIE_SECURITY.md](../sprint-9e/SESSION_COOKIE_SECURITY.md).

## 4. Tampered cookies rejected

For each session type:

- [ ] Acquire a valid cookie, mutate any character.
- [ ] Re-request a protected route.
- [ ] Result: unauthenticated state (302 to login or 401), not an error 500.
- [ ] Server log records the HMAC failure WITHOUT logging the cookie value.

## 5. Dealer cannot access another dealer's data

Tested manually by operator:

- [ ] Dealer A's session cookie cannot read Dealer B's offers via direct URL (e.g., `/dealer/offers/<B-offer-id>`).
- [ ] Dealer A's session cookie cannot read Dealer B's media via direct URL.
- [ ] API endpoints scope all reads/writes by `dealer_id` derived from session, never trusting URL/body.
- [ ] Reference: [docs/sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md](../sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md).

## 6. OTP raw phone not logged

- [ ] `OtpAttempt` schema has `phone_hash` and **no** `phone` column.
- [ ] `AuditLog` entries related to OTP carry the hash, not the raw value.
- [ ] Production logs (Vercel) grep'd for AZ phone format `+994\d{9}` — zero matches outside of the mock provider's `[MOCK-OTP]` line (mock is dev-only and never enabled in production).
- [ ] Implementation: [lib/auth/phone.ts](../../lib/auth/phone.ts) `phoneHash()`, [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts).

## 7. Media upload validates MIME and magic bytes

Tested by uploading samples:

- [ ] JPEG (valid magic bytes, MIME `image/jpeg`) → accepted.
- [ ] PNG (valid magic bytes, MIME `image/png`) → accepted.
- [ ] WebP (valid magic bytes, MIME `image/webp`) → accepted.
- [ ] Renamed `.txt` file with `.jpg` extension (wrong magic bytes, claimed MIME `image/jpeg`) → rejected.
- [ ] File with valid JPEG magic bytes but MIME `application/octet-stream` → rejected (defense-in-depth).
- [ ] Implementation: [lib/media/validation.ts](../../lib/media/validation.ts).
- [ ] Reference: [docs/sprint-9d/MEDIA_SECURITY_RULES.md](../sprint-9d/MEDIA_SECURITY_RULES.md).

## 8. SVG blocked

- [ ] Direct SVG upload → rejected with a clear error.
- [ ] Renamed SVG with `.png` extension and `image/png` claimed MIME → rejected (magic-byte check catches it).
- [ ] Renamed SVG with `.jpg` extension → rejected (magic-byte check catches it).

Rationale: SVG can carry inline JavaScript and is a script-injection vector.

## 9. `/api/health` leaks no secrets

- [ ] Hit `https://staging.zolaq.az/api/health`.
- [ ] Response body is JSON with only booleans and short status strings.
- [ ] No secret value (no salt, no key, no password) appears in the response body.
- [ ] No secret value appears in the response headers.
- [ ] Implementation: [app/api/health/route.ts](../../app/api/health/route.ts).

## 10. Audit log captures sensitive actions

Verify a row exists for each:

- [ ] Admin sign-in success and failure.
- [ ] Dealer sign-in success and failure.
- [ ] OTP request and verification.
- [ ] Admin role assignment / revocation.
- [ ] Brand/Model/Generation/Trim CRUD.
- [ ] Dealer profile approve / reject.
- [ ] Dealer offer approve / reject.
- [ ] Media approve / reject.
- [ ] Content publish / unpublish.
- [ ] Settings change.
- [ ] Reference: [docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md](../sprint-9a/AUDIT_LOG_REQUIREMENTS.md).

Each row carries: actor ID, action, target resource, before state, after state, timestamp.

## 11. Beta data privacy notes

- [ ] Top of the closed-beta feedback form explains data handling ([CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md)).
- [ ] Tester invitation includes a one-line privacy note.
- [ ] No third-party tracking SDKs loaded during beta (no GA, no Hotjar, no Sentry-with-PII).
- [ ] Vercel Analytics in privacy-friendly mode (no cookies, no fingerprinting).
- [ ] Beta uploads from dealers are clearly marked as staging-only.

## 12. Additional checks (closed-beta-specific)

- [ ] `DEV_AUTH_MODE` is unset (NOT `true`, NOT `"false"`) in Vercel env for `staging.zolaq.az`.
- [ ] Mock SMS provider's `[MOCK-OTP]` line in logs is acceptable for closed beta but must be disabled before public launch.
- [ ] Vercel access logs do not include URL fragments that could carry PII.

## Sign-off

```
Reviewer: __________
Date: 2026-__-__
Result: PASS | PASS with notes | FAIL
Open items: __________
```

If any item fails, treat as **P0** per [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md).

## Cross-references

- Sprint 9 baseline: [docs/sprint-9j/SECURITY_QA_CHECKLIST.md](../sprint-9j/SECURITY_QA_CHECKLIST.md)
- Auth security architecture: [docs/sprint-9e/AUTH_SECURITY_ARCHITECTURE.md](../sprint-9e/AUTH_SECURITY_ARCHITECTURE.md)
- Customer OTP security review: [docs/sprint-9e/CUSTOMER_OTP_SECURITY_REVIEW.md](../sprint-9e/CUSTOMER_OTP_SECURITY_REVIEW.md)
- Media security rules: [docs/sprint-9d/MEDIA_SECURITY_RULES.md](../sprint-9d/MEDIA_SECURITY_RULES.md)
- Session cookie security: [docs/sprint-9e/SESSION_COOKIE_SECURITY.md](../sprint-9e/SESSION_COOKIE_SECURITY.md)
- Secrets policy: [docs/sprint-9i/SECRETS_POLICY.md](../sprint-9i/SECRETS_POLICY.md)
