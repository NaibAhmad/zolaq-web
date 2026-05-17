# Sprint 9H — VIN Check Foundation Implementation Notes

Status: **PASS** (foundation only — types, validation, hash, repository stubs, quota stub; **no Prisma models, no routes, no UI**).

Source of truth for the long-term VIN Check design: [docs/sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md](../sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md). This document records only what landed this sprint and what is intentionally deferred.

## What landed

| File | Purpose |
|------|---------|
| [lib/vin-check/types.ts](../../lib/vin-check/types.ts) | Enums as string-literal unions: `VinCheckStatus` (8), `VinReportType` (4), `VinRiskLevel` (5), `VinRiskFlag` (8), `QuotaSource` (5). Entity types: `VinCheckRequest`, `VinCheckResult`, `VinCheckQuota`, `VinCheckSummaryDto`, `QuotaCheckResult`. |
| [lib/vin-check/validation.ts](../../lib/vin-check/validation.ts) | `normalizeVin()`, `isValidVin()` (17-char ISO 3779 + check-digit), `vinLast4()`. Pure functions, no I/O. |
| [lib/vin-check/hash.ts](../../lib/vin-check/hash.ts) | `vinHash(vin)` — SHA-256 with `VIN_HASH_SALT`. Mirrors [lib/auth/phone.ts](../../lib/auth/phone.ts) salt-loader pattern. Throws in production if salt unset; dev fallback `zolaq-dev-vin-salt`. |
| [lib/vin-check/repository.ts](../../lib/vin-check/repository.ts) | Stubs for `findRequest`, `createRequest`, `findResultByVinHash`, `recordResult`. Every body throws `VinCheckNotImplementedError`. Function signatures match addendum §4 so the deferred work is purely mechanical. |
| [lib/vin-check/quota.ts](../../lib/vin-check/quota.ts) | `checkQuota()` stub returning `{ allowed: false, reason: "NOT_IMPLEMENTED" }`. `monthlyFreeBasicLimit()` returns the locked `2` value from addendum §3. |
| [lib/vin-check/index.ts](../../lib/vin-check/index.ts) | Public surface; only this path should be imported. |

### Env var added

`VIN_HASH_SALT` — added to [.env.example](../../.env.example). In dev a fixed fallback is used (with a runtime throw deferred until first call). Production MUST set this — the server will refuse to compute a hash without it. Rotation invalidates all existing hashes; treat as permanent once set.

## Architectural rules honored

These are reaffirmed from the addendum and locked into the foundation:

- **Verified user required** (R11.1) — no anonymous VIN checks. Quota model assumes a stable `user_id`. (Enforcement deferred until route lands.)
- **Server-side quota** (R11.2) — `quota.ts` is server-only (`import "server-only"`). Client-side counters are forbidden.
- **Cache reuse does not consume quota** (R11.3) — `findResultByVinHash()` exists in the seam so a future implementation can short-circuit `quota_checked → completed` without incrementing the quota.
- **VIN stored as hash only** (R11.4) — `vinHash()` ships now; the repository signature accepts `vin_hash` + `vin_last4` only, never raw VIN.
- **Raw provider data server-only** (R11.5) — `VinCheckResult.raw_provider_payload` is part of the server type; `VinCheckSummaryDto` is the public-safe shape with no provider names and no raw payload.
- **Naming** — never "Free Carfax" / "Carfax" / "AutoCheck" in any user-facing copy. Internal comments may reference providers. (`vinCheck.*` dictionary keys in [lib/i18n/translations/common.az.json](../../lib/i18n/translations/common.az.json) follow this rule.)

## What is intentionally deferred (per user decision)

Per the answered question *"Types + validation + hash + repository stubs only (Recommended)"*:

1. **No Prisma models.** `VinCheckRequest`, `VinCheckResult`, `VinCheckProvider`, `VinCheckQuota`, `VinCheckCredit`, `VinCheckCache` — none added to [prisma/schema.prisma](../../prisma/schema.prisma). Adding them now would require a migration the project cannot run without a real DB.
2. **No API routes.** No `/api/vin-check/*`, no `/api/admin/vin-check/*`.
3. **No public UI.** No `/vin` page, no car-detail integration.
4. **No provider integration.** `VinCheckProvider` catalog deferred; no `lib/vin-check/providers/` directory.
5. **No quota enforcement.** `checkQuota()` returns `NOT_IMPLEMENTED`; no `VinCheckCredit` flow.
6. **No effect on price / dealer verification / recommendation.** The strict one-way boundary (addendum §3 #2) is preserved by not landing any code that could cross it.

## Why stubs-only is safe

- All new files are unimported by any existing component. `tsc --noEmit` type-checks them but they cannot break anything that compiles today.
- No Prisma schema changes → no migration needed → DB-availability fallback unaffected.
- `vinHash()` is the only function with runtime behavior; it is unreachable from any current code path.
- Repository stubs throw a typed error rather than returning silently; any future code that wires them in will fail loudly until the bodies are implemented.

## How to use (when implementation starts)

```ts
import {
  normalizeVin,
  isValidVin,
  vinHash,
  vinLast4,
  createRequest,
  type VinReportType,
} from "@/lib/vin-check";

const raw = normalizeVin(input);
if (!isValidVin(raw)) throw new Error("invalid VIN");
const request = await createRequest({
  user_id,
  vin_hash: vinHash(raw),
  vin_last4: vinLast4(raw),
  report_type: "basic" satisfies VinReportType,
}); // will throw VinCheckNotImplementedError until repository is wired
```

## Open TODOs (next VIN sprint)

- Add Prisma models per addendum §4 (`VinCheckRequest`, `VinCheckResult`, `VinCheckProvider`, `VinCheckQuota`, `VinCheckCredit`, `VinCheckCache`).
- Wire repository bodies; every status transition and credit movement writes one `AuditLog` row in the same `$transaction`.
- Implement `checkQuota()` with `(user_id, month_anchor)` upsert.
- Add internal admin routes `POST /api/admin/vin-check/credit/grant` (protected by `admin.vin_check.manage` permission).
- Add public verified-user routes `POST /api/vin-check/request`, `GET /api/vin-check/quota` (R11.1).
- Add `lib/vin-check/providers/` adapters (mock first; partner adapter when contract signed).
- Add `VIN_PROVIDER_*` env vars to [.env.example](../../.env.example) when the provider abstraction lands.
- UI: car-detail integration shows `VinCheckSummaryDto` as an advisory section (never as part of the price card).
