# Admin Catalog QA — Sprint 9C

Manual walk-through after install. Both fallback and DB modes.

## Generations

1. Log in as `super_admin`. Sidebar: **Kataloq → Nəsillər**.
2. List shows seed rows (Toyota Camry XV80, Volvo XC60 II, Hyundai Tucson NX4,
   Kia EV6 1-ci nəsil).
3. Inline form: create new generation, e.g. BMW X5 → "G05", display "G05 · 2019–2024",
   from 2019, to 2024, status Aktiv. Submit. Page reloads, row appears.
4. Click row → edit page. Change `production_year_to` from 2024 to 2023.
   Submit. Returns to list.
5. **Validation:** set `production_year_to=2018` (lower than from). Submit.
   Expect 400 "İstehsal ili bitiş başlanğıcdan kiçik ola bilməz."
6. Archive button on edit page → status flips to Deaktiv (visible in list).
7. **Audit:** /admin/audit-log shows `generation.create`, `generation.update`,
   `generation.archive` rows.

## Trim form — advanced specs

1. **Kataloq → Komplektasiyalar**. Click any trim (e.g. Toyota Camry).
2. New `Nəsil` dropdown appears between Marka/Model and İl — shows generations
   for the trim's `(brand_id, model_name)`, plus the "Bütün nəsillər" option.
3. Expand **Texniki xüsusiyyətlər** `<details>` panel — 16 optional fields.
4. Fill a few (e.g. engine "2.5L Hybrid", transmission "e-CVT", battery_kwh 1.6,
   acceleration_0_100 8.4). Save.
5. Reload page → values persist (stored in `lib/catalog/trim-specs-store.ts`).
6. **Validation:** set generation to one whose year range doesn't include the
   trim's year. Expect 400 "il nəsil aralığından kənardadır".
7. **Audit:** `trim.update` row + a second `trim_spec.update` row when any
   spec field was provided.

## Public-side regression

1. `/cars` — search still works (Sprint 8H intact).
2. `/cars?generation=xv80` — generation filter still works.
3. `/cars?year_from=2021&year_to=2024` — year-range filter still works.
4. `/cars/[carId]` — detail page renders; advanced specs not displayed yet
   (UI surfacing is future work).
5. `/compare` — comparison still works.
6. Quick Search on `/` — brand/model/generation funnel intact.

## DB mode (optional)

After `npm run prisma:migrate` + `npm run db:seed`:

1. Edit any generation → `generation.update` row appears in DB:
   `SELECT * FROM audit_logs WHERE entity_type='generation' ORDER BY created_at DESC LIMIT 3;`
2. Restart `npm run dev` → audit rows persist; generation edits do NOT
   persist (generations store stays globalThis-only this sprint).
3. This is the expected fallback-mode behaviour for catalog domain — it
   only changes when catalog is cut over to DB in a future sprint.
