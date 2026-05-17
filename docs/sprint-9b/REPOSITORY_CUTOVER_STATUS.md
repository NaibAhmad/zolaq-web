# Repository Cutover Status

Snapshot at the end of Sprint 9B. The Sprint 9A migration plan recommends
**audit-log first** (safest write-only foundation) and **catalog last**
(longest soak, hot path). Sprint 9B follows that recommendation.

| Domain | Wrapper exists | DB cut-over | Notes |
|---|---|---|---|
| `audit` | ✅ [lib/audit/repository.ts](../../lib/audit/repository.ts) | ✅ **YES** | First and only cutover this sprint. Helper-mediated audit (`audit()` in [api-utils.ts](../../lib/admin/api-utils.ts)) is fire-and-forget DB write. Direct `writeAudit` callers (auth routes, store internals) still memory-only — see [FALLBACK_MODE.md](FALLBACK_MODE.md). |
| `catalog` | ✅ [lib/catalog/repository.ts](../../lib/catalog/repository.ts) | ❌ | Re-exports `lib/admin/catalog-store`. Public reads in `lib/cars/lookup.ts` unchanged. |
| `catalog/trim-specs` | ✅ [lib/catalog/trim-specs-store.ts](../../lib/catalog/trim-specs-store.ts) | ❌ | New in Sprint 9C. Separate globalThis store so Trim shape stays unchanged. |
| `generations` | ✅ [lib/generations/repository.ts](../../lib/generations/repository.ts) | ❌ | New in Sprint 9C. Bootstraps from `lib/cars/generations.ts` seed. |
| `dealers` | ✅ [lib/dealers/repository.ts](../../lib/dealers/repository.ts) | ❌ | Re-exports `lib/admin/dealer-store`. |
| `offers` | ✅ [lib/offers/repository.ts](../../lib/offers/repository.ts) | ❌ | Re-exports `lib/admin/catalog-store` price/offer helpers. |
| `media` | ✅ [lib/media/repository.ts](../../lib/media/repository.ts) | ⚠️ partial | Hybrid: DB if available, in-memory globalThis fallback otherwise. New in Sprint 9D. |
| `leads` | ❌ | ❌ | Untouched this sprint. |
| `decisions` | ❌ | ❌ | Untouched this sprint. |
| `ads / invoices / payments` | ❌ | ❌ | Untouched this sprint. |
| `market-pulse` | ❌ | ❌ | Untouched this sprint. |
| `gamification` | ❌ | ❌ | Untouched this sprint. |
| `content` | ❌ | ❌ | Untouched this sprint. |
| `auth / OTP` | ❌ | ❌ | Untouched this sprint. |

## Future sprint order (per 9A migration plan)

1. Content (low write volume)
2. Ads / Invoices / Payments (internal, isolated)
3. Bazar Nəbzi (DB UNIQUE constraint for vote dedup)
4. Gamification (pure side-channel)
5. Leads (highest user-facing risk; longest soak)
6. Decisions / SavedCar / ViewedCar
7. Dealer submissions
8. Catalog (hot path; last; longest soak — Sprint 8H search lives here)
