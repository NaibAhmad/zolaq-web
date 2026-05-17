# Sprint 10 — Beta Data Quality Checklist

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** Per-entity gate before any new seed entry is committed or any dealer-submitted entity is approved during closed beta.

## How to use

For each entity being added or approved, run the matching checklist below. Any "No" answer blocks the entity until resolved.

## A. Brand

- [ ] Name spelled correctly per the brand's official AZ-market presence.
- [ ] Logo image is the manufacturer's official asset (or a placeholder marked `seed_origin: "beta_staging_2026"`).
- [ ] Brand `slug` is URL-safe, lowercase, hyphenated.
- [ ] No duplicate brand exists in the DB.

## B. Model

- [ ] Tied to a valid `brand_id`.
- [ ] Name matches the brand's official AZ-market naming (e.g., "Atto 3", not "Yuan Plus" if BYD markets it as Atto 3 in AZ).
- [ ] `slug` is URL-safe and unique within the brand.
- [ ] Body type / segment classification consistent with the brand's official spec.

## C. Generation

- [ ] Tied to a valid `model_id`.
- [ ] Year-range is correct and non-overlapping with sibling generations of the same model.
- [ ] Chassis code or generation identifier matches manufacturer documentation.
- [ ] At least one trim references this generation.

## D. Trim

- [ ] Tied to a valid `generation_id` (or explicitly null with a documented reason for single-generation models).
- [ ] Trim name matches the manufacturer's official designation.
- [ ] `body_type`, `fuel_type`, `transmission`, `drivetrain` filled in.
- [ ] Power / torque values are numeric and match the spec source.
- [ ] At least one `TrimSpec` row exists.
- [ ] At least one `CatalogPrice` row exists OR the trim is marked `price_pending: true`.
- [ ] Source URL recorded (operator notes or `seed_origin` metadata).

## E. TrimSpec

- [ ] Each numeric field has units matching the schema (kW, Nm, km, kWh, etc.).
- [ ] Range / consumption figures cite the standard (WLTP / NEDC / CLTC) where applicable.
- [ ] No spec field is set if the source did not state it (leave null, not zero).

## F. CatalogPrice

- [ ] `trim_id` references an existing trim.
- [ ] `price` is in AZN with currency clearly noted.
- [ ] `source` field populated (e.g., `byd_official_az_2026q1`, `dealer_premium_auto_pricelist_2026-04`).
- [ ] `status` set to `verified` or `unverified` (never blank).
- [ ] `valid_from` / `valid_to` populated if the price is time-bounded.

## G. Dealer

- [ ] Legal name matches public registration.
- [ ] At least one verified phone number.
- [ ] Verified email.
- [ ] Physical location coordinates checked against Google Maps.
- [ ] Operating hours filled in.
- [ ] License / registration number captured (internal, not publicly displayed).
- [ ] At least one storefront/team photo uploaded via the media flow.
- [ ] Dealer profile is **approved** (not pending) before any offer is published.

## H. DealerOffer

- [ ] References a real `trim_id` (not just a model or generation).
- [ ] Price within ±20% of the catalog price for that trim, or flagged `price_anomaly: true` for operator review.
- [ ] At least one media asset attached.
- [ ] `status` set to `pending` on creation; `approved` only after operator review.
- [ ] No claims that conflict with official manufacturer specs (e.g., dealer-claimed range > spec range).
- [ ] Contact method specified (phone / form / WhatsApp number).

## I. Media asset

- [ ] MIME type: JPEG / PNG / WebP (SVG rejected).
- [ ] Magic-byte signature validated by [lib/media/validation.ts](../../lib/media/validation.ts).
- [ ] File size ≤ `MEDIA_UPLOAD_MAX_MB` (8 MB default).
- [ ] Resolution ≤ 4000 × 4000 (operator visual check).
- [ ] No watermarks from competing services.
- [ ] No personal data visible in image (license plates, faces of non-staff).
- [ ] Has an `owner_id` linking to a dealer / admin / trim.
- [ ] Dealer-submitted assets are queued for `media.approve` before publication.

## J. Content (News / Encyclopedia / Q&A / Bazar Nəbzi)

- [ ] Author identified (operator name or community user ID).
- [ ] Published date set.
- [ ] Body has no broken Markdown / links.
- [ ] No claims about the VIN Check feature being publicly available (VIN Check stays internal in beta).
- [ ] No promises about features that aren't shipped (private seller, online payment, WhatsApp Business).
- [ ] Sources cited for any factual claim.
- [ ] Encyclopedia entries do **not** use "Carfax" / "Free Carfax" terminology (per Sprint 9 vocabulary policy).

## K. Audit trail

- [ ] An `AuditLog` row exists for every approval / rejection action.
- [ ] Operator initials present in `actor_id` (not a system user).
- [ ] Reason field populated for any rejection.

## L. Beta-marker hygiene

- [ ] Any entry created from a non-public source carries `seed_origin: "beta_staging_2026"`.
- [ ] No entry without provenance escapes the staging gate.

## Sign-off

```
Entity type: <Trim/Dealer/Offer/...>
Entity ID: <...>
Reviewer: <operator initials>
Date: 2026-MM-DD
Result: APPROVE | REJECT (reason: ...)
```

## Cross-references

- Population plan: [BETA_DATA_POPULATION_PLAN.md](./BETA_DATA_POPULATION_PLAN.md)
- Admin operator SOP: [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md)
- Media validation: [lib/media/validation.ts](../../lib/media/validation.ts)
- Media security: [docs/sprint-9d/MEDIA_SECURITY_RULES.md](../sprint-9d/MEDIA_SECURITY_RULES.md)
