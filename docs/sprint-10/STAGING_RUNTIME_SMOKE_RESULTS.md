# Staging Runtime Smoke Results (Sprint 10B)

> **Status: PAUSED for Sprint 10D (2026-05-17).** Staging execution is deferred
> until the founder restarts Phase A. Every row below stays `MANUAL_REQUIRED`
> — none are marked FAIL. Local demo preview (Sprint 10D) continues against
> the in-memory fallback and is tracked separately in the Sprint 10D final
> report. See [CLOSED_BETA_GO_NO_GO_DECISION.md](./CLOSED_BETA_GO_NO_GO_DECISION.md).

Manual smoke checklist run by the operator against the **live** staging host
(`https://staging.zolaq.az` or, before DNS, the Vercel preview URL). Each row
is PASS / FAIL / MANUAL_REQUIRED with operator notes. Until the operator runs
through this in a real browser, every row stays at MANUAL_REQUIRED.

Automated complement: run `node scripts/closed-beta-smoke.mjs` first — it
covers everything probeable over HTTP. The items below need a real browser,
real session, or real eyes.

## Setup before running

- [ ] `node scripts/verify-staging-env.mjs` exits 0 or 2 (warnings only)
- [ ] `BETA_SMOKE_BASE_URL=<staging url> node scripts/closed-beta-smoke.mjs` exits 0
- [ ] Vercel function logs are open in a second tab (needed to capture
      `[MOCK-OTP]` codes since `SMS_PROVIDER=mock`)

## Checklist

| #   | Check                                                              | Status            | Notes |
| --- | ------------------------------------------------------------------ | ----------------- | ----- |
| 1   | Admin login at `/admin/login` with real password succeeds          | MANUAL_REQUIRED   |       |
| 2   | Dealer login at `/dealer/login` with real password succeeds        | MANUAL_REQUIRED   |       |
| 3   | Tampered session cookie (manually edited) is rejected on next req  | MANUAL_REQUIRED   |       |
| 4   | Logged in as dealer A, cannot access dealer B's data via direct URL| MANUAL_REQUIRED   |       |
| 5   | `POST /api/auth/otp/request` succeeds; OTP code captured from logs | MANUAL_REQUIRED   |       |
| 6   | `POST /api/auth/otp/verify` with captured code issues a session    | MANUAL_REQUIRED   |       |
| 7   | Homepage Quick Search submits to `/cars?brand=…&model=…`           | MANUAL_REQUIRED   |       |
| 8   | `/cars` Nəsil / Komplektasiya filter cascade behaves (Sprint 8H)   | MANUAL_REQUIRED   |       |
| 9   | Car detail page `/cars/<trim_id>` renders price + dealer offers    | MANUAL_REQUIRED   |       |
| 10  | `/compare?ids=a,b,c` renders side-by-side                          | MANUAL_REQUIRED   |       |
| 11  | Admin can create/update/delete a Generation via admin UI           | MANUAL_REQUIRED   |       |
| 12  | Admin can upload an image (≤ 8 MB) — saved + visible               | MANUAL_REQUIRED   |       |
| 13  | Dealer can upload an image — saved + visible only to that dealer   | MANUAL_REQUIRED   |       |
| 14  | Dealer can submit a new offer for one of their dealership's trims  | MANUAL_REQUIRED   |       |
| 15  | `/api/health` returns 200 with `database.available: true`          | MANUAL_REQUIRED   |       |
| 16  | At 390×844 viewport: no horizontal overflow on `/`, `/cars`        | MANUAL_REQUIRED   |       |
| 17  | Dark/light theme toggle persists across page reload                | MANUAL_REQUIRED   |       |

## Aggregate result

- [ ] All 17 rows PASS → mark **STAGING_RUNTIME_SMOKE_PASS** below
- [ ] Any FAIL → mark **STAGING_RUNTIME_SMOKE_FAIL** below and link to triage

### Operator sign-off

```
Date (UTC):
Operator:
Build commit:
Vercel deployment URL:
Result: STAGING_RUNTIME_SMOKE_{PASS|FAIL|MANUAL_REQUIRED}
```

If result is FAIL, file each failure in [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md)
and reflect blockers in [CLOSED_BETA_GO_NO_GO_DECISION.md](CLOSED_BETA_GO_NO_GO_DECISION.md).
