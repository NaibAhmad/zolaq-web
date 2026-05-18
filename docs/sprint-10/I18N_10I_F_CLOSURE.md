# Sprint 10I-F — Admin/Dealer Operator i18n Final Sweep — Closure Report

## Final decision

**Sprint 10I-F: PASS**

All four blocking buckets are at 0, dictionary parity is enforced and clean,
all five build gates pass, and `npm run i18n:audit -- --check=blocking` exits 0.

## 1. Files changed

| Area | Count |
|---|---:|
| Admin pages (`app/admin/(authed)/**/page.tsx`) | ~30 |
| Dealer pages (`app/dealer/(authed)/**/page.tsx`) | ~10 |
| Admin chrome components (`components/admin/`) | 1 (RoleSwitcher) |
| Dealer chrome components (`components/dealer/`) | 1 (DealerTopbar) |
| Dictionaries (`lib/i18n/translations/common.{az,en,ru}.json`) | 3 |
| Audit script (`scripts/audit-i18n-hardcoded.mjs`) | 1 |

Full git diff: 128 files modified across the working tree (includes the larger
in-flight Sprint 10I-E remnants — Sprint 10I-F-specific files are listed above).

Notable per-page sweeps:

- `app/admin/(authed)/dashboard/page.tsx` — already wired; verified.
- `app/admin/(authed)/catalog/{brands,models,generations,trims,prices}/{page,[id],new}/page.tsx` — full sweep.
- `app/admin/(authed)/dealers/{page,[dealerId]}/page.tsx` — full sweep.
- `app/admin/(authed)/offers/{page,[offerId],sub/[submissionId]}/page.tsx` — full sweep.
- `app/admin/(authed)/media/page.tsx` — full sweep.
- `app/admin/(authed)/content/{news,encyclopedia,qa}/{page,[contentId]}/page.tsx` — chrome sweep (body via `getLocalizedText`).
- `app/admin/(authed)/market-pulse/{page,new,[topicId]}/page.tsx` — full sweep, BAZAR_CADENCE/STATUS now routed through translation keys.
- `app/admin/(authed)/ads/{page,new,[adRequestId]}/page.tsx` — full sweep, AD_PACKAGE/PLACEMENT/STATUS routed through translation keys.
- `app/admin/(authed)/invoices/{page,new,[invoiceId]}/page.tsx` — full sweep.
- `app/admin/(authed)/payments/{page,[paymentId]}/page.tsx` — full sweep.
- `app/admin/(authed)/roles/page.tsx` — full permission-label sweep.
- `app/dealer/(authed)/profile/page.tsx` — full sweep (helper banner expanded).
- `app/dealer/(authed)/offers/{page,new,[offerId]}/page.tsx` — full sweep.
- `app/dealer/(authed)/media/page.tsx` — full sweep.
- `app/dealer/(authed)/payment-proof/page.tsx` — full sweep.
- `app/dealer/(authed)/ad-requests/{page,new,[adRequestId]}/page.tsx` — full sweep.
- `app/dealer/(authed)/invoices/[invoiceId]/page.tsx` — full sweep.
- `components/admin/RoleSwitcher.tsx` — server component, `getServerT()` wired.
- `components/dealer/DealerTopbar.tsx` — server component, `getServerT()` wired.

## 2. Admin/master closure summary

| Bucket | Pre (10I-E) | Post (10I-F) | Delta |
|---|---:|---:|---:|
| `BLOCKING-admin` | 246* | **0** | **−246** |

\* `BLOCKING-admin` baseline = original 252 with the 6 admin chrome (RoleSwitcher)
already cleared during component sweep, dropping to 246 before page work.

All listed admin routes now translate chrome, titles, table headers, form
labels, placeholders, filter labels, buttons, status labels, empty/loading/error
states, permission/forbidden messages, and visible audit action labels.

## 3. Dealer closure summary

| Bucket | Pre (10I-E) | Post (10I-F) | Delta |
|---|---:|---:|---:|
| `BLOCKING-dealer` | 56 | **0** | **−56** |

All listed dealer routes now translate chrome, titles, table headers, form
labels, placeholders, buttons, status labels, empty/loading/error states.

## 4. Editor-body deferred summary

| Bucket | Count |
|---|---:|
| `DEFERRED-editor-body` | 0 |

Per-line `/* i18n:editor-body */` mechanism is implemented in the audit script,
but no editor page currently has hardcoded body fallback strings. Long-form
editor pages (`app/admin/(authed)/content/news/[contentId]/page.tsx`,
`.../encyclopedia/[contentId]/page.tsx`, `.../qa/[contentId]/page.tsx`,
`app/admin/(authed)/market-pulse/{new,[topicId]}/page.tsx`) source all body
content via `getLocalizedText(field, locale)` — no literal defaults exist to
defer.

## 5. Dictionary keys added

| Namespace | Approx new leaves |
|---|---:|
| `adminLoginPlaceholder` | +1 |
| `adminCatalog` | +60 |
| `adminDealers` | +10 |
| `adminOffers` (new section) | +29 |
| `adminMedia` (new section) | +21 |
| `adminContent` | +47 |
| `adminCommercial` | +94 |
| `adminRoles` | +30 |
| `dealerNav` | +3 |
| `dealerProfile` | +4 |
| `dealerOffers` (new section) | +24 |
| `dealerMedia` | +5 |
| `dealerPayments` | +9 |
| `dealerAds` | +16 |
| `dealerInvoices` | +14 |

**Total leaf-count delta**: ~1165 → 1566 (+401 new keys per locale; +1203 lines
of dictionary JSON across the three files).

All new keys mirrored to `common.az.json`, `common.en.json`,
`common.ru.json`. Parity is enforced by the new audit step
`checkDictionaryParity()` — any drift fails `npm run i18n:audit -- --check=blocking`.

## 6. i18n audit before/after by bucket

| Bucket | Baseline (pre) | Final (post) | Δ |
|---|---:|---:|---:|
| `BLOCKING-public` | 0 | 0 | 0 |
| `BLOCKING-profile` | 0 | 0 | 0 |
| `BLOCKING-dealer` | 56 | **0** | **−56** |
| `BLOCKING-admin` | 252 | **0** | **−252** |
| `DEFERRED-editor-body` | 0 | 0 | 0 |
| `ALLOWED-proper-nouns-units` | 1 | 0 | −1 |
| `OTHER` | 2 | 2 | 0 |
| **TOTAL candidates** | **311** | **2** | **−309** |

Raw JSON: `reports/i18n-baseline.json` (pre) and `reports/i18n-final.json` (post).

## 7. Exact build gate results

```
$ npx prisma validate
✓ The schema at prisma\schema.prisma is valid 🚀

$ npm run lint
✓ (eslint exited 0, no warnings)

$ npx tsc --noEmit
✓ (no diagnostics, no --skipLibCheck used)

$ npm run build
✓ Compiled successfully in 6.9s
✓ Generating static pages using 11 workers (110/110)

$ npm run i18n:audit -- --check=blocking
✓ --check=blocking passed: no blocking candidates remain and dictionaries are in parity.
```

## 8. Remaining blockers

**None.**

## 9. Remaining non-blocking TODOs

`OTHER` bucket — 2 candidates left, both intentionally out of operator scope:

1. `app/layout.tsx:21` — page-level `<meta description>` ("Zolaq — maşın seçimini öyrən, müqayisə et və rəsmi diler təklifi al."). This is SEO/social-card copy, not operator UI. Recommended for a future SEO sprint that introduces locale-aware metadata.
2. `components/brand/Logo.tsx:19` — Logo `aria-label` ("Zolaq — ana səhifə"). Accessibility label on the brand mark; visible to screen readers only. Recommended for the same future SEO/a11y sprint.

Audit script enhancements added in this sprint that future sprints can build on:
- `--json=<path>` and `--baseline=<path>` flags now work; closure reports can diff per-bucket.
- `ALLOWED-proper-nouns-units` is now counted rather than silently filtered.
- `DEFERRED-editor-body` per-line markers (`/* i18n:editor-body */`) are recognized; ready when a future editor introduces literal body defaults.

## 10. Final decision

**Sprint 10I-F: PASS** — all required surfaces translate cleanly in AZ/EN/RU,
build gates green, dictionary parity enforced, no blockers remaining.
