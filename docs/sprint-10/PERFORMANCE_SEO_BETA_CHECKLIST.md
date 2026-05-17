# Sprint 10 — Performance & SEO Beta Checklist

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Posture:** Closed beta is **not** SEO launch. The point is to keep staging un-indexable and to verify nothing regressed vs Sprint 9.

## 1. Staging must not be indexed

This is the single most important item in this checklist. A leak into Google's index during closed beta would burn the public-launch SEO playbook.

### 1.1 Robots header

Every HTML response from `staging.zolaq.az` must carry:

```
X-Robots-Tag: noindex, nofollow
```

How to set on Vercel:
- Add it via [next.config.mjs](../../next.config.mjs) `headers()` async function, gated on `process.env.VERCEL_ENV !== "production"` (or a custom `IS_STAGING` env var).
- **Sprint 10 housekeeping:** if this header is not present on the first deploy, add it before announcing the beta to testers. Track as a non-blocking TODO if absent at planning time.

### 1.2 `robots.txt`

`staging.zolaq.az/robots.txt` must serve:

```
User-agent: *
Disallow: /
```

How to set:
- Add `app/robots.ts` returning `{ rules: { userAgent: "*", disallow: "/" } }`, again gated on the staging env.
- Production `robots.txt` will be different — that's a Sprint 11+ concern.

### 1.3 Sitemap

- `staging.zolaq.az/sitemap.xml` should either 404 or return an empty sitemap during closed beta. A populated sitemap on staging encourages crawler discovery.
- If a sitemap route exists, gate it on staging-env to return empty.

### 1.4 Verify

```bash
curl -i https://staging.zolaq.az/                | grep -i x-robots
curl -i https://staging.zolaq.az/robots.txt      # must show Disallow: /
curl -i https://staging.zolaq.az/sitemap.xml     # 404 or empty
```

- [ ] `X-Robots-Tag: noindex, nofollow` present on `/`.
- [ ] `X-Robots-Tag` present on `/cars`, `/cars/<carId>`, `/dealers`, `/news`, `/encyclopedia`, `/qa`.
- [ ] `robots.txt` denies all.
- [ ] No populated `sitemap.xml`.
- [ ] (Optional) HTTP Basic Auth in front of `staging.zolaq.az` as an extra moat.

## 2. Metadata sanity

- [ ] Each public page returns a `<title>`.
- [ ] Each public page returns a meaningful `<meta name="description">`.
- [ ] OpenGraph tags render correctly on shared links (test by pasting a `/cars/<carId>` URL into Telegram or a Slack preview).
- [ ] No leftover Sprint-9 placeholders ("Lorem ipsum", "TODO") in any metadata.
- [ ] Title format consistent across page types (e.g., `<page name> — Zolaq`).

## 3. Canonical strategy

- [ ] Canonical link element points to `https://staging.zolaq.az/...` for staging (or omitted; do NOT point staging canonicals at a production domain that doesn't exist yet).
- [ ] No conflicting canonical between server-rendered HTML and client-side patches.
- [ ] Reference: [docs/sprint-9g/SEO_LOCALE_STRATEGY.md](../sprint-9g/SEO_LOCALE_STRATEGY.md).

## 4. i18n SEO posture

Closed beta does NOT switch route prefixes (e.g., `/ru/cars`) on the live URL. Per Sprint 9 decision and the Sprint 10 scope, public route switching is feature-flagged off.

- [ ] No `hreflang` alternates appear in `<head>` during beta.
- [ ] Locale switching uses cookie / accept-language only.
- [ ] If a future change moves to route-based locales, that's out of Sprint 10 scope.

## 5. Image sizing

- [ ] All hero / card images use Next.js `<Image>` with explicit `width` / `height` or `fill` + `sizes`.
- [ ] No raw `<img>` tags on critical paths.
- [ ] Images served via `/uploads/...` (local provider) are sized server-side (or scaled CSS-side with no layout shift).
- [ ] Spot-check: car detail hero image is < 300 KB on mobile.
- [ ] Spot-check: card grid on `/cars` does not transfer > 2 MB on first paint.

## 6. Mobile layout stability (390px)

- [ ] No horizontal scroll on `/`, `/cars`, `/cars/<carId>`, `/dealers`, `/dealers/<slug>`, `/compare`, `/news`, `/encyclopedia`, `/qa`, `/profile`, `/profile/saved`, `/profile/viewed`.
- [ ] CTAs are reachable without scrolling sideways.
- [ ] Sticky headers / bottom nav do not occlude content.
- [ ] Touch targets ≥ 44px square on primary actions.

## 7. Core Web Vitals — no regression vs Sprint 9

Capture baseline numbers from Sprint 9's PageSpeed Insights (or equivalent) reports if available; otherwise establish a new baseline at the first deploy.

| Metric | Target | Acceptable for beta |
|---|---|---|
| LCP | < 2.5s on a mid-tier Android | < 3.5s |
| INP | < 200ms | < 500ms |
| CLS | < 0.1 | < 0.25 |
| TTFB | < 600ms | < 1.5s |

- [ ] PageSpeed Insights for `https://staging.zolaq.az/` shows no metric crossing into "Poor."
- [ ] PageSpeed Insights for `/cars` shows no metric crossing into "Poor."
- [ ] PageSpeed Insights for one `/cars/<carId>` shows no metric crossing into "Poor."
- [ ] Compare with Sprint 9 closure numbers; flag any regression > 10%.

## 8. Theme parity

- [ ] All checked pages render without contrast regressions in light AND dark theme.
- [ ] No flash of unstyled content (FOUC) on first paint.
- [ ] No theme-only layout shifts (text reflowing between themes indicates a font weight/spacing mismatch).

## 9. JS bundle hygiene

- [ ] Vercel build report: no unexpected large client bundles introduced this sprint.
- [ ] No new dependencies > 100 KB gzipped without an explicit decision (Sprint 10 doesn't add deps — flag if any appear in `package.json`).

## 10. Cache strategy

- [ ] Static assets (`/_next/static/...`) carry long-cache headers (default Next.js behavior — verify not overridden).
- [ ] `/api/*` responses do NOT carry long-cache headers.
- [ ] `/api/health` is uncached (response carries `Cache-Control: no-store` or equivalent).

## Sign-off

```
Reviewer: __________
Date: 2026-__-__
Result: PASS | PASS with notes | FAIL
Open items: __________
```

## Cross-references

- Sprint 9 SEO strategy: [docs/sprint-9g/SEO_LOCALE_STRATEGY.md](../sprint-9g/SEO_LOCALE_STRATEGY.md)
- Sprint 9 i18n notes: [docs/sprint-9g/I18N_IMPLEMENTATION_NOTES.md](../sprint-9g/I18N_IMPLEMENTATION_NOTES.md)
- Monitoring plan: [docs/sprint-9j/MONITORING_LOGGING_PLAN.md](../sprint-9j/MONITORING_LOGGING_PLAN.md)
- Media architecture (image sizing): [docs/sprint-9d/MEDIA_UPLOAD_ARCHITECTURE.md](../sprint-9d/MEDIA_UPLOAD_ARCHITECTURE.md)
