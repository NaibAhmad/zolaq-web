# VIN_REPORT_SUMMARY_ARCHITECTURE — Sprint 10I

**Status:** P0 architecture only. No UI, no route, no runtime, no provider in 10I.
Builds on the existing VIN beta (`NEXT_PUBLIC_FEATURE_VIN_BETA`).

## Goal

Define how Zolaq turns a VIN report (or report data) into a **plain-language,
risk-focused, user-facing summary** — with raw report data processed server-side,
never exposed to the client, and always carrying a disclaimer and an audit-log
foundation.

## What this is NOT

- **Not raw report passthrough.** The client never receives the raw report.
- **Not a verdict.** It summarizes risk flags; it does not certify a car as
  good/bad or replace a physical inspection.
- **Not a price/valuation tool.** Valuation is out of scope here.

## P0 flow

```
User provides VIN report / report data
        │
        ▼
Server-side ingestion  ── raw report stored server-side only (access-controlled)
        │
        ▼
Server-side processing ── extract & normalize risk flags
        │
        ▼
VinReportSummary  ── user-facing, risk flags summarized, no raw fields
        │           + disclaimer + confidence + last updated
        ▼
Audit log entry  ── who/what/when (foundation for compliance)
```

Every step except "user provides" is **server-side**. The client receives only
`VinReportSummary` — never the raw report.

## Entities (proposed)

### `VinReportInput`
| Field | Type | Notes |
| --- | --- | --- |
| `input_id` | id | primary key |
| `vin` | string | normalized VIN |
| `submitted_by` | id | user (server-side reference only) |
| `raw_payload_ref` | ref | pointer to server-side stored raw report (access-controlled, **never** sent to client) |
| `source_kind` | enum | `user_upload` \| `report_data` \| `provider` (future) |
| `received_at` | timestamp | |
| `retention_expires_at` | timestamp | drives deletion (see *Privacy*) |

### `VinReportSummary`
| Field | Type | Notes |
| --- | --- | --- |
| `summary_id` | id | primary key |
| `input_id` | id | source input |
| `vin` | string | |
| `risk_flags` | VinRiskFlag[] | normalized, user-safe |
| `overall_risk_band` | enum | `low` \| `medium` \| `high` \| `unknown` |
| `confidence_level` | enum | `high` \| `medium` \| `low` \| `beta_signal` \| `insufficient_data` |
| `disclaimer_shown` | bool | must be true before display |
| `generated_at` | timestamp | "last updated" |

### `VinRiskFlag`
| Field | Type | Notes |
| --- | --- | --- |
| `flag_id` | id | |
| `category` | enum | `accident` \| `odometer` \| `title` \| `theft` \| `service` \| `other` |
| `severity` | enum | `info` \| `attention` \| `serious` |
| `summary_text` | string | user-safe plain language, no raw fields |
| `source_basis` | string | what in the report supports it |

### `VinSummaryAuditLog` (foundation)
| Field | Type | Notes |
| --- | --- | --- |
| `audit_id` | id | |
| `actor_id` | id | user/operator |
| `action` | enum | `submitted` \| `processed` \| `viewed` \| `deleted` |
| `vin_hash` | string | hashed, not raw VIN, where feasible |
| `at` | timestamp | |
Aligns with `docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md`.

## Rules

- **Raw report stays server-side.** Never serialize raw report fields into a
  client response or analytics payload.
- **Summary only.** The user sees `VinReportSummary` + `VinRiskFlag[]`.
- **Risk flags summarized**, categorized and severity-graded; plain language.
- **Disclaimer required** before display: summary based on provided report,
  not a guarantee, does not replace physical inspection. Template in
  `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`.
- **Audit log foundation required**: submit / process / view / delete events.
- **Confidence visible.** Sparse/ambiguous reports ⇒ `low`/`insufficient_data`.
- **No hallucinated flags.** Every flag must trace to `source_basis` from the
  report; the AI explanation (`AI_ASSISTANT_SCOPE.md`) may only explain existing
  flags, never invent them.

## Privacy

- Raw report retained server-side under access control with
  `retention_expires_at`; deletion path required (see
  `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md` → security/privacy and
  `docs/sprint-9d/MEDIA_SECURITY_RULES.md` patterns for uploaded files).
- User-initiated deletion removes the raw input; audit log retains a
  non-sensitive record of the deletion.
- No raw VIN or report fields in tracking payloads.

## Cross-references

- AI explanation of summary → `AI_ASSISTANT_SCOPE.md`
- Confidence & disclaimer → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Audit baseline → `docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md`
- Voice add-on (P1) → `VIN_VOICE_ANALYSIS_SCOPE.md`
- Placement → `UX_PLACEMENT_RULES.md`

## Not in Sprint 10I

- No ingestion/processing runtime, no provider, no storage schema, no UI, no
  route. The existing VIN beta flow is unchanged.
