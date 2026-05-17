# Sprint 9J — Security QA Checklist

Run this checklist before declaring any release production-ready. Most checks require a running staging instance with `NODE_ENV=production` and `DEV_AUTH_MODE` unset.

## Auth surface

- [ ] `/admin/login` shows the placeholder (NOT the mock role picker).
- [ ] `/dealer/login` shows the placeholder (NOT the mock dealer picker).
- [ ] `POST /api/admin/auth/login` returns `503 AUTH_NOT_AVAILABLE` (until Sprint 9F lands the real path).
- [ ] `POST /api/dealer/auth/login` returns `503 AUTH_NOT_AVAILABLE` (same).
- [ ] OTP request without phone → `400 VALIDATION_ERROR`.
- [ ] OTP request with malformed phone → `400 VALIDATION_ERROR`.
- [ ] OTP verify with wrong code → `400` and `attempt_count` incremented (audit event `otp.failed`).
- [ ] OTP rate limit triggers after 3 requests in an hour (audit event `otp.rate_limited`).

## Cookie / session tamper resistance

- [ ] Edit `zlq_admin_session` cookie value (flip one base64 char) → server rejects, treats as unauthenticated.
- [ ] Edit `zlq_dealer_session` similarly → rejected.
- [ ] Edit `zlq_session` (customer) similarly → rejected.
- [ ] Re-use a session cookie from another user's account → rejected if HMAC fails, otherwise verify role/scope (see scope checks below).
- [ ] Session cookies are `httpOnly`, `sameSite=lax`, `secure` (the last only in production).

## Role / scope separation

- [ ] Customer session cannot reach `/admin/*` (redirect/401).
- [ ] Customer session cannot reach `/dealer/*` (redirect/401).
- [ ] Admin session cannot read `/profile/leads` as the customer (route requires customer session, not admin).
- [ ] Dealer A signed-in cannot fetch dealer B's leads (`GET /api/dealer/leads` filtered by `session.dealerId`).
- [ ] Dealer A cannot fetch dealer B's offer submissions via direct URL.
- [ ] Dealer A cannot upload media on behalf of dealer B (path-or-body `dealer_id` mismatch → `403`, audit row written).

## PII handling

- [ ] No raw phone numbers in server logs — only truncated hashes (`phoneHash().slice(0, 8)`).
- [ ] No raw OTP codes in production logs.
- [ ] No raw VIN in any log (when VIN routes land).
- [ ] No session cookie values logged.
- [ ] No `Authorization` / `Cookie` headers echoed in error responses.

## Secrets hygiene

- [ ] `.env` is gitignored (verify with `git check-ignore .env`).
- [ ] `.env.example` contains NO real values.
- [ ] `git log -p -- .env*` shows no committed real values across history.
- [ ] Source code grep returns no provider API keys: `grep -rn "sk_live_\|pk_live_\|Bearer eyJ" --include="*.ts" --include="*.tsx" --include="*.js" .`
- [ ] No `console.log` of `process.env.AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT`, `SMS_API_KEY`.

## Health endpoint

- [ ] `GET /api/health` returns `200` with `status: "ok"` AND `environment: "production"` AND `devAuthMode: false` when properly configured.
- [ ] Response body contains NO secret VALUES — only presence booleans.
- [ ] Response sets `Cache-Control: no-store`.

## Data integrity (restore drill)

- [ ] After a backup restore, `AuditLog` row count matches the source within expected delta.
- [ ] Admin/dealer/user records intact; passwords (when 9F lands) still hash-verify.
- [ ] Foreign-key relationships intact (sample 20 random rows from each major table; verify referenced rows exist).

## Public route inventory

- [ ] No NEW public routes added since the previous release without security review.
- [ ] No public route returns user-specific data without a session check.
- [ ] No internal/admin/dealer route is exposed without the corresponding `requireAdmin()` / `requireDealer()` guard.

## Out of scope this sprint (will be checked when 9F lands)

- Real password hashing (bcryptjs).
- DB-backed OTP persistence.
- SMS provider abstraction in production.
- Per-action `dealer.*` permissions.
