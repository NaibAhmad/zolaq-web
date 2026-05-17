# Generations CRUD — Sprint 9C

## What landed

- **List page** [app/admin/(authed)/catalog/generations/page.tsx](../../app/admin/(authed)/catalog/generations/page.tsx)
  — inline create form + table. Visible to `super_admin`, `internal_ops_admin`.
- **Edit page** [app/admin/(authed)/catalog/generations/[generationId]/page.tsx](../../app/admin/(authed)/catalog/generations/[generationId]/page.tsx)
  — editable fields + archive button (soft delete).
- **API** [app/api/internal/generations/route.ts](../../app/api/internal/generations/route.ts)
  (GET list filter, POST create) and
  [app/api/internal/generations/[generationId]/route.ts](../../app/api/internal/generations/[generationId]/route.ts)
  (GET, PATCH, DELETE → archive).
- **Repository** [lib/generations/repository.ts](../../lib/generations/repository.ts)
  — bootstraps from `lib/cars/generations.ts:GENERATIONS` seed into a
  globalThis-pinned Map; same in-memory pattern as every other admin store.
- **Sidebar entry** added under "Kataloq" in [components/admin/AdminSidebar.tsx](../../components/admin/AdminSidebar.tsx).

## Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `brand_id` | enum (existing brand) | yes | Dropdown of `listBrands()`. |
| `model_name` | string | yes | Free-text (Trim links by `(brand_id, model_name)` not `model_id`). |
| `name` | string | yes | e.g. "XV80", "G05", "1-ci nəsil". |
| `display_name` | string | yes | UI string, e.g. "XV80 · 2023–". |
| `production_year_from` | int | yes | Inclusive lower bound. |
| `production_year_to` | int | no | Null = open-ended ("present"). |
| `status` | `active` / `inactive` | yes | Defaults to `active`. |
| `source` | string | no | Provenance tag. |
| `verification_status` | string | no | Provenance tag. |

## Validation rules

- `production_year_to >= production_year_from` (both create + update).
- Trim's `generation_id` must reference an existing generation; trim's `year`
  must fall in `[from, to ?? +∞]`. Enforced in
  [app/api/internal/trims/[trimId]/route.ts](../../app/api/internal/trims/[trimId]/route.ts)
  PATCH handler — 400 with Azerbaijani error otherwise.
- Dealer offer routes (`app/api/dealer/offers/*`) DO NOT read `generation_id`
  — `trim_id` is the canonical reference (R6 invariant). No change needed.

## Delete behaviour

DELETE (or POST with `_method=delete`) **archives** by flipping
`status` → `inactive`. Hard delete is deferred: a future PR can add it once
catalog is cut over to DB and we can enforce FK semantics at the database
level. The handler counts referencing trims and includes that in the audit
note so reviewers can see why hard delete was withheld.

## Audit actions

- `generation.create` → `audit_logs` entity `generation`.
- `generation.update`
- `generation.archive`

All extended in [lib/admin/types.ts](../../lib/admin/types.ts) `AuditAction`
union.

## Public-side impact

None. The existing seed in [lib/cars/generations.ts](../../lib/cars/generations.ts)
is still the source `listGenerationsForModel()` and `getGenerationById()` read
from — those public helpers are unchanged. The new mutable store is a shadow
used only by admin pages. When catalog is cut over to DB in a future sprint,
public helpers will re-point at the repository too.
