# Advanced Trim Specs — Sprint 9C

## What landed

- **TrimSpec store** [lib/catalog/trim-specs-store.ts](../../lib/catalog/trim-specs-store.ts)
  — one-to-one with Trim by `trim_id`. Globalthis-pinned map. All fields
  optional.
- **Trim edit form** [app/admin/(authed)/catalog/trims/[trimId]/page.tsx](../../app/admin/(authed)/catalog/trims/[trimId]/page.tsx)
  — added a collapsible `<details>` panel "Texniki xüsusiyyətlər (opsional)"
  so the existing basic edit flow stays uncluttered.
- **Trim PATCH route** [app/api/internal/trims/[trimId]/route.ts](../../app/api/internal/trims/[trimId]/route.ts)
  reads spec fields via existing `pick`/`pickNumber` helpers and calls
  `upsertTrimSpec()`. Writes a `trim_spec.update` audit row.
- **DB schema** [prisma/schema.prisma](../../prisma/schema.prisma) `TrimSpec`
  model defined; cascade on Trim delete.

## Fields

| Field | Type | UI label |
|---|---|---|
| `engine` | string | Mühərrik |
| `engine_displacement_l` | float | Mühərrik həcmi (L) |
| `torque_nm` | int | Burulma momenti (N·m) |
| `transmission` | string | Transmissiya |
| `drivetrain` | string | Sürücü oxu |
| `seats` | int | Oturacaq sayı |
| `battery_kwh` | float | Batareya (kWh) |
| `fuel_consumption_l_100km` | float | Yanacaq sərfi (L/100km) |
| `charging_ac_kw` | float | AC dolanma gücü (kW) |
| `charging_dc_kw` | float | DC dolanma gücü (kW) |
| `acceleration_0_100` | float | 0–100 km/saat (san) |
| `ground_clearance` | int | Dövriyyə (mm) |
| `dimensions` | string | Ölçülər (uz · en · hün) |
| `warranty` | string | Zəmanət |
| `source` | string | Mənbə |
| `verification_status` | string | Təsdiq statusu |
| `last_updated` | ISO date | (auto on upsert) |

`power_hp` and `range_km` stay on the basic Trim shape (already used by
Sprint 8H filter UI) — they are NOT moved into TrimSpec.

## Public-side impact

None. Public pages (`/cars`, `/cars/[carId]`, `/compare`) read from the basic
Trim shape via `lib/cars/lookup.ts`. They do not read TrimSpec. Future work:
surface the advanced specs on `/cars/[carId]` once design lands.
