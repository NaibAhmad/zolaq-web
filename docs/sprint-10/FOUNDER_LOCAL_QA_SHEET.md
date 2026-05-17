# Founder Local QA Sheet — Sprint 10G

Manual QA log for the founder local demo. Walk every row, record Actual, set
Status (PASS / ISSUE / NEEDS DATA), and add notes. Pair with
[LOCAL_DEMO_PRESENTATION_FLOW.md](LOCAL_DEMO_PRESENTATION_FLOW.md).

Scope: **local demo only**. Staging/Vercel/Supabase frozen.

Run `npm run dev`, log in to admin via `/admin/login`, log in to dealer via
`/dealer/login` (DEV mode mock role picker), then walk the table.

---

| # | Area | URL | Expected | Actual | Status | Notes |
|---|------|-----|----------|--------|--------|-------|
| 1 | Homepage | `/` | Hero, quick search, featured brands, news strip, Bazar Nəbzi module render; no console error |  |  |  |
| 2 | VIN beta | `/` (VIN card) | Card visible when `NEXT_PUBLIC_FEATURE_VIN_BETA=true`; 17-char form accepts input; mock risk result; clearly labelled beta |  |  |  |
| 3 | Language selector | Header dropdown | AZ/RU/EN toggle visible when `NEXT_PUBLIC_FEATURE_I18N_BETA=true`; switching flips strings in-place; no route change to `/ru` or `/en` |  |  |  |
| 4 | Catalog search | `/cars` | Full catalog list (20 trims), side filters, pagination |  |  |  |
| 5 | Nəsil filter | `/cars?generation=xv80` | Filter chip pinned; only XV80 trims listed |  |  |  |
| 6 | Komplektasiya filter | `/cars?brand=toyota&model=camry` | Toyota Camry trims listed with energy_type, power_hp, range_km |  |  |  |
| 7 | Car detail | Any `/cars/[trim-slug]` | Hero, catalog PriceCard, dealer offers (if any), spec table, related models |  |  |  |
| 8 | Compare | `/compare` | Add ≥2 trims; spec rows align; no console error |  |  |  |
| 9 | Dealer page | `/dealers/[slug]` | Trust summary, verification badge, offer list, contact CTA |  |  |  |
| 10 | News | `/news` and one `/news/[slug]` | List + detail render; 3 articles seeded |  |  |  |
| 11 | Encyclopedia | `/encyclopedia` and one `/encyclopedia/[slug]` | List + detail render; 5 entries seeded |  |  |  |
| 12 | Q&A | `/qa` | 5 Q&A render; question + answer visible |  |  |  |
| 13 | Bazar Nəbzi | Homepage module | 8 topics render; expiry dates in the future |  |  |  |
| 14 | Profile badges | `/profile/badges` | Badge grid renders |  |  |  |
| 15 | Activity history | `/profile/history` | Timeline renders (may be empty for fresh user) |  |  |  |
| 16 | Admin catalog | `/admin/catalog/generations`, `/admin/catalog/trims` | Lists render with seeded rows; forms editable; advanced spec section opens on trim detail |  |  |  |
| 17 | Admin dealer | `/admin/dealers`, `/admin/offers` | 3 dealers listed; offers page shows pending submissions queue + published offers |  |  |  |
| 18 | Admin content | `/admin/content/news`, `/admin/content/encyclopedia`, `/admin/content/qa`, `/admin/market-pulse` | Lists render; create forms accept entries; audit log records creates |  |  |  |
| 19 | Dealer panel | `/dealer/dashboard`, `/dealer/offers/new` | Dashboard renders; new-offer form requires trim_id; submitted offer reaches `/admin/offers` |  |  |  |
| 20 | Mobile 390px | All public pages at 390px width | Header/MobileBottomNav render; cards stack; no horizontal scroll |  |  |  |
| 21 | Dark / light | Toggle (or system) | Both themes render without color regressions; contrast acceptable |  |  |  |

---

## Founder sign-off

- Date: _____________
- Tester: ___________
- Overall: ☐ PASS  ☐ PASS WITH ISSUES  ☐ NOT PASS
- Blockers (if any): _________________________________
- Issues filed against:
  [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md)

## Reminders
- Do not resume Vercel/Supabase staging.
- Do not commit unless explicitly instructed.
- Demo/staging rows must be tagged in `notes` or `source_name`.
