# Closed Beta — Go / No-Go Decision (Sprint 10B)

> **Sprint 10D pause note (2026-05-17):** Staging execution is **paused, not
> failed**. Phase A (Vercel env injection) and Phase C (DB migration / seed /
> bootstrap) are deferred to a later sprint at the founder's request. Local
> demo preview work (VIN beta card, language selector beta, gamification
> verification, dealer panel local preview) continues under Sprint 10D and is
> tracked outside this matrix. Every row below stays in its current pending /
> required state — **no row is marked FAILED**. The decision field stays
> pending. When the founder restarts Phase A, Sprint 10C resumes from here.

Single source of truth for whether the closed beta is cleared to start. State
flips as evidence comes in. Decision is one of:

- `GO` — all criteria met, no documented limitations
- `GO_WITH_LIMITATIONS` — all blocking criteria met, accepted limitations listed
- `NO_GO` — at least one blocking criterion fails

## Decision

```
Decision:        GO_WITH_LIMITATIONS  (pending operator sign-off below)
Decided by:      _________________________
Decision date:   _________________________  (UTC)
Effective from:  _________________________
Sprint anchor:   Sprint 10B (Staging Runtime Setup & Closed Beta Execution)
```

## Criteria matrix

| #  | Criterion                                                        | State           | Evidence                                                         |
| -- | ---------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| 1  | Build gates pass (`prisma validate`, `lint`, `tsc`, `next build`) | TODO / PASS     | [Phase 8 of plan](../../C:/Users/NaibPC/.claude/plans/start-sprint-10b-shimmying-steele.md) |
| 2  | `node scripts/check-env-safety.mjs` exits 0 locally              | TODO / PASS     | local CI run                                                      |
| 3  | `node scripts/verify-staging-env.mjs` exits 0 or 2 on Vercel staging | STAGING_CREDENTIALS_REQUIRED | run after founder wires DATABASE_URL etc. |
| 4  | DB migration / seed / bootstrap admin executed on staging        | STAGING_DB_REQUIRED | [STAGING_DB_EXECUTION_LOG.md](STAGING_DB_EXECUTION_LOG.md)        |
| 5  | DB verification checklist all green                              | STAGING_DB_REQUIRED | [STAGING_DB_VERIFICATION_CHECKLIST.md](STAGING_DB_VERIFICATION_CHECKLIST.md) |
| 6  | Admin login works on staging                                     | MANUAL_REQUIRED | smoke row 1                                                       |
| 7  | Dealer login works on staging                                    | MANUAL_REQUIRED | smoke row 2                                                       |
| 8  | OTP request + verify works (mock provider accepted for cohort)   | MANUAL_REQUIRED | smoke rows 5–6                                                    |
| 9  | Public catalog search works (Sprint 8H not regressed)            | MANUAL_REQUIRED | smoke rows 7–10; `closed-beta-smoke.mjs` §A                       |
| 10 | Cross-tenant dealer scope enforced                               | MANUAL_REQUIRED | smoke row 4                                                       |
| 11 | `/api/health` returns no secrets                                 | TODO / PASS     | `closed-beta-smoke.mjs` §C                                        |
| 12 | Staging noindex active (`X-Robots-Tag` + deny-all `robots.txt`)  | TODO / PASS     | [STAGING_NOINDEX_POLICY.md](STAGING_NOINDEX_POLICY.md) acceptance tests |
| 13 | `closed-beta-smoke.mjs` exits 0 against staging                  | TODO            | run with `BETA_SMOKE_BASE_URL=https://staging.zolaq.az`           |
| 14 | Manual runtime smoke checklist passes                            | MANUAL_REQUIRED | [STAGING_RUNTIME_SMOKE_RESULTS.md](STAGING_RUNTIME_SMOKE_RESULTS.md) |

## Accepted limitations (folded into GO_WITH_LIMITATIONS)

These were confirmed with the founder during planning and are explicitly
acceptable for the closed beta cohort. None are acceptable for a public
launch.

### L1 — Media storage = local

- `MEDIA_STORAGE_PROVIDER=local` on staging.
- Uploads land on the Vercel function's ephemeral filesystem and may
  disappear on cold-start redeploys.
- Mitigation: closed beta has limited media volume; re-upload acceptable.
- **P0 blocker for public launch.** Real Supabase Storage or Vercel Blob
  must be wired before any public cutover.

### L2 — SMS provider = mock

- `SMS_PROVIDER=mock` on staging.
- OTP codes are not delivered to phones — operators surface them to cohort
  testers via Vercel function logs (`[MOCK-OTP]` line) or a private channel.
- Closed beta cohort is small, vetted, and informed of this constraint.
- **P0 blocker for public launch.** Real HTTP SMS provider with
  `SMS_API_URL`/`SMS_API_KEY`/`SMS_SENDER_ID` must be wired before any
  public cutover.

## Blockers (must clear before flipping decision to GO_WITH_LIMITATIONS)

- [ ] STAGING_CREDENTIALS_REQUIRED — founder supplies `DATABASE_URL`,
      `DIRECT_URL`, `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`,
      `VIN_HASH_SALT`, `INITIAL_ADMIN_*`, `STAGING_NO_INDEX=true` on Vercel
      Staging.
- [ ] STAGING_DB_REQUIRED — operator runs the migration/seed/bootstrap
      sequence per [STAGING_DB_EXECUTION_LOG.md](STAGING_DB_EXECUTION_LOG.md).
- [ ] MANUAL_REQUIRED — operator runs [STAGING_RUNTIME_SMOKE_RESULTS.md](STAGING_RUNTIME_SMOKE_RESULTS.md)
      in a real browser and signs off.
- [ ] DNS — `staging.zolaq.az` CNAME → Vercel; alias confirmed.

## Sign-off

When every criterion above is PASS (or explicitly accepted as L1/L2) and
every blocker is cleared, an authorized signer flips the **Decision** field
above from the pending value to `GO_WITH_LIMITATIONS`, fills in their name
and the date, and shares the link with the cohort.

If at the smoke step any FAIL appears, the decision becomes **NO_GO**, the
failure is filed in [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md),
and Sprint 10B reopens until resolved.

## Reaching full GO

Full GO (no limitations) requires both L1 and L2 to be resolved. That is
**out of scope** for Sprint 10B. Track in a follow-up sprint:

- Wire real media provider (Supabase Storage or Vercel Blob)
- Wire real HTTP SMS provider
- Re-run this decision artifact targeting `GO` instead of `GO_WITH_LIMITATIONS`
