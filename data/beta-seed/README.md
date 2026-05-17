# Beta Seed (Sprint 10B)

Closed beta data load lives **here**, separate from the canonical app seed
under [lib/cars/seed](../../lib/cars/seed). The canonical seed is the source
of truth for catalog data shipped with the codebase; this folder is staging-
and beta-only and **must not** be treated as production data.

Validate any file in this folder with:

```
node scripts/validate-beta-seed.mjs
```

## Target volume for closed beta

| Entity            | Target  |
| ----------------- | ------- |
| Brands            | 10–15   |
| Models            | 30–50   |
| Generations       | 20–40   |
| Trims             | 50–100  |
| Dealers           | 5–10    |
| Dealer offers     | 20–50   |
| Catalog prices    | 50–100  |
| Encyclopedia      | 15–25   |
| News              | 10–15   |
| Q&A               | 20–30   |
| Bazar Nəbzi topics| 3–5     |

## ID conventions (mirrors canonical schema)

- `trim_id` is **canonical** — every dealer offer and catalog price references
  a real `trim_id`. Never invent trim ids that don't exist in `trims.json`.
- `generation_id` is **separate** from `trim_id`. A generation groups multiple
  trims; a trim belongs to one optional generation. Never reuse `trim_id` as
  `generation_id`.
- Catalog `amount` (in `catalog-prices.json`) is the "manufacturer / market
  reference price". Dealer offer `amount` (in `dealer-offers.json`) is the
  dealer's quoted price. These are **never** the same row.

## Required metadata fields

Every record MUST include:

- `source` — short string identifying where the entry came from (e.g.
  `"manufacturer-press-2024"`, `"dealer-quote-2026-04"`). For obviously
  fabricated demo entries, use `"beta-demo"`.
- `verification` — one of `"unverified"`, `"source-checked"`, `"verified"`.

If a record is NOT confirmed official data, it MUST also include:

- `is_beta_demo: true`

Records with `is_beta_demo=true` must NEVER be promoted to the canonical seed
without re-sourcing.

## File layout

```
data/beta-seed/
├── README.md                        (this file)
├── templates/                       (empty-array starting points)
│   ├── brands.json
│   ├── models.json
│   ├── generations.json
│   ├── trims.json
│   ├── catalog-prices.json
│   ├── dealers.json
│   ├── dealer-offers.json
│   ├── encyclopedia.json
│   ├── news.json
│   ├── qa.json
│   └── bazar-nebzi.json
└── live/                            (created by founder when populating)
    └── ...same names as templates...
```

The validator scans `live/` first, then falls back to `templates/`. Templates
are empty arrays and always validate clean — they exist so that
`scripts/validate-beta-seed.mjs` runs successfully before any real beta data
is loaded.

## See also

- [BETA_DATA_POPULATION_PLAN.md](../../docs/sprint-10/BETA_DATA_POPULATION_PLAN.md) — overall strategy
- [BETA_DATA_QUALITY_CHECKLIST.md](../../docs/sprint-10/BETA_DATA_QUALITY_CHECKLIST.md) — quality gates
