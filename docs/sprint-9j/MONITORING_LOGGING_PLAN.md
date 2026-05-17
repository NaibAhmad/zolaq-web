# Sprint 9J — Monitoring & Logging Plan

## Logging strategy (today)

All log output is `console.log` / `console.warn` / `console.error`. Next.js captures these and forwards them to whatever log destination the hosting provider exposes (stdout in containers, runtime logs on Vercel/Netlify, journald on bare metal).

No dedicated logger module yet — adding one is in the deferred list. Until then:

- Use `console.error` for failure paths that should page someone.
- Use `console.warn` for recoverable issues that an operator should review.
- Use `console.log` for normal operational signal (audit-adjacent events that are not in the `AuditLog` table).
- **Never log raw phone, raw VIN, password values, password hashes, session secrets, OTP codes, or provider API keys.** The OTP/phone path already truncates the hash before logging — see [app/api/auth/otp/request/route.ts:17-27](../../app/api/auth/otp/request/route.ts).

## Audit logging (today)

DB-backed via [lib/audit/repository.ts](../../lib/audit/repository.ts) writing to the `AuditLog` table. In hybrid mode (no DB) falls back to in-memory; production deploys must have a real DB to retain audit history across restarts.

Existing audit events that should be monitored:

- `otp.requested`, `otp.rate_limited`, `otp.verified`, `otp.failed`, `otp.expired`, `otp.locked` — OTP lifecycle.
- Admin sign-in / sign-out (Sprint 9E).
- Dealer sign-in / sign-out (Sprint 9E).
- Dealer scope violation (`auditDealerScopeViolation` at [lib/admin/api-utils.ts:119](../../lib/admin/api-utils.ts#L119)).
- Catalog mutations (admin actions on brand/model/generation/trim).
- Dealer submissions (offer, media, ad-request, profile-update, payment-proof).

### Retention

- Minimum 90 days for all audit rows. Production DB backups (see [BACKUP_POLICY.md](./BACKUP_POLICY.md)) extend effective retention.
- Compliance / legal hold may require longer for OTP and admin events; document any extension in `docs/sprint-X/AUDIT_RETENTION_DECISION.md` when needed.

## Uptime monitoring

- Poll `GET /api/health` every 60s from an external uptime monitor.
- Treat HTTP `503` (returned when `status: "degraded"`) as a real outage; page on-call.
- Treat HTTP timeout > 10s as a real outage; page on-call.

## Alerting thresholds

| Signal | Source | Threshold | Action |
|---|---|---|---|
| `5xx` rate | hosting provider log / metrics | > 1% for 5 minutes | page on-call |
| Failed auth (admin/dealer) | `AuditLog` action `admin.login_failed` / `dealer.login_failed` | > 10 / minute / IP | rate-limit + investigate |
| OTP rate-limit hit | `AuditLog` action `otp.rate_limited` | > 50 / hour total | review for abuse |
| Dealer scope violation | `AuditLog` action `dealer.scope_violation` | ≥ 1 | page security on-call; this is a real incident |
| VIN risk-flag `critical` returned | `AuditLog` action `vin_check_completed` + flag (when 9H+ ships) | new pattern in 24h | review provider config |
| Health check `degraded` | `/api/health` | 2 consecutive polls | page on-call |
| DB connection failure | `isDatabaseAvailable()` flips to false at runtime | any | page on-call; likely incident |

## Logging hygiene to enforce

- **Never log raw phone** — only `phoneHash().slice(0, 8)` per existing convention.
- **Never log raw VIN** — only `vinHash().slice(0, 8)` + `vinLast4()` for display.
- **Never log session cookie values** — log the cookie name only, never the signed payload.
- **Never log OTP codes** outside the `[MOCK-OTP]` dev path; production must redact.
- **Never log `Authorization` or `Cookie` request headers in full.**

## Future work

- Structured JSON logging (replace `console.*` with a thin wrapper that emits JSON lines for log-aggregator parsing).
- Per-request correlation ID injected via middleware.
- Metrics export (Prometheus / OpenTelemetry) for non-log signals (latency histograms, queue depths).
- Sentry / Honeybadger / equivalent for client-side error capture.

None of these are in scope for Sprint 9 production-readiness; they are listed as the next observability sprint's intake.
