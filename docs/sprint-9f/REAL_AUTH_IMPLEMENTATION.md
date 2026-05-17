# Sprint 9F — Real Auth Implementation Overview

Sprint 9E built the auth shell: HMAC-signed cookies, three independent cookies
(customer / admin / dealer), Prisma schema for AdminUser / AdminUserRole /
AdminSession / DealerUser / OtpAttempt, and audit actions for login events.
But the actual production-ready pieces were deferred behind `DEV_AUTH_MODE`
and stubs.

Sprint 9F closes the gap.

## What 9F adds

| Area | 9E state | 9F state |
|---|---|---|
| Admin login | Mock picker only (`RoleSwitcher`), gated by `DEV_AUTH_MODE` | Real email/password via scrypt; mock picker remains for dev |
| Dealer login | Mock dealer picker, hard-coded role=owner | Real email/password; role honored from `DealerUser.role` |
| Password hashing | None | `node:crypto` scrypt, `scrypt$N=32768$r=8$p=1$<salt>$<hash>` format |
| Lockout | None | 5 failures within 15 min freezes the account |
| Session revocation | Cookie-clear only | DB-backed `AdminSession.revoked_at` + `DealerSession.revoked_at` |
| Dealer per-action perms | Single `requireDealer` gate | 12 granular `dealer.*` permissions × owner/manager/staff matrix |
| OTP persistence | `globalThis` Map | DB-backed `OtpAttempt` with `code_hash`, falls back to memory only when DB unavailable |
| SMS delivery | `console.log("[MOCK-OTP] ...")` | `lib/sms/` provider layer: `mock` / `http` / `disabled` |
| Initial admin | Not bootstrapped | `npm run bootstrap:admin` from `INITIAL_ADMIN_*` env vars |

## Files added

- `lib/auth/password.ts` — scrypt hash + verify.
- `lib/sms/{provider,mock-provider,http-provider,index}.ts` — SMS layer.
- `scripts/bootstrap-admin.ts` — initial super_admin seeder.
- `components/auth/PasswordSignInForm.tsx` — real password form, used by both
  `/admin/login` and `/dealer/login`.
- `docs/sprint-9f/*.md` — sprint docs.

## Files modified

- `prisma/schema.prisma` — added `DealerSession` model; extended `OtpAttempt`
  with `code_hash`, `max_attempts`, `consumed_at`, `locked_at`, and a
  `(phone_hash, purpose, created_at)` index.
- `lib/auth/{admin,dealer}-user-repository.ts` — replaced "Not implemented"
  stubs with real DB-backed implementations.
- `lib/auth/{admin,dealer}-session.ts` — added optional `sessionId` field so
  logout can revoke the DB row.
- `lib/auth/otp-store.ts` — DB-mode reads/writes `OtpAttempt`, falls back to
  memory; `verifyCode` replaces the old `incrementAttempts` + plaintext
  comparison.
- `lib/auth/otp-provider.ts` — delegates to `getSmsProvider()`.
- `lib/auth/permissions.ts` — 12 new `dealer.*` permissions + matrix.
- `lib/admin/api-utils.ts` — `requireDealerPermission`.
- `app/api/admin/auth/{login,logout}/route.ts` — real-password branch +
  `revoke_at`.
- `app/api/dealer/auth/{login,logout}/route.ts` — same for dealer.
- All 14 `app/api/dealer/*/route.ts` route files — swapped `requireDealer` →
  `requireDealerPermission(request, "dealer.<perm>")`. Only `/api/dealer/me`
  keeps `requireDealer` (basic session check).
- `app/admin/(authed)/roles/page.tsx` — labels for the 12 new permissions.
- `.env.example` — `SMS_PROVIDER`, `SMS_*`, `INITIAL_ADMIN_*` documented.
- `package.json` — `bootstrap:admin` script.

## Build & migration status

- `npx prisma validate` — pass.
- `npx prisma format` — applied.
- `npx prisma generate` — client regenerated for new fields/models.
- **No migration is run by 9F.** See [MIGRATION_PLAN.md](MIGRATION_PLAN.md)
  for the exact command and the full SQL preview.
- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — see [9F_QA_CHECKLIST.md](9F_QA_CHECKLIST.md).
