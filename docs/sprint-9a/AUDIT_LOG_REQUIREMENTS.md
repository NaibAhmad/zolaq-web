# Audit Log Requirements — Sprint 9A

## 1. Current state (problem statement)

Today's audit log is a `globalThis`-pinned array in [lib/admin/audit.ts](../../lib/admin/audit.ts):

```ts
const store: AuditStore = g.__zlq_audit_store ?? (g.__zlq_audit_store = { entries: [] });
```

Properties:
- Append-only `AuditLogEntry[]` in memory.
- No retention, no eviction — grows until server restart, then resets to empty.
- `writeAudit()` is synchronous and called inline from every store mutation.
- `listAuditLog({limit?, actor_id?, entity_type?, entity_id?, action?})` filters and sorts the array client-side (in Node).

Consequences:
- Audit is lost on every server restart.
- No durable forensic trail for security incidents.
- No cross-process visibility (each Node worker has its own `globalThis`).
- Filtering scales O(n) — fine for development, broken under any real load.

---

## 2. Target — `AuditLog` table (Postgres)

Schema (mirrors [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md)):

```prisma
model AuditLog {
  audit_id    String          @id                              // "audit_<uuid>"
  actor_type  AuditActorType                                    // admin | dealer | system
  actor_id    String
  role        String                                            // free-form role string (admin role / "dealer" / "customer" / "system")
  action      String                                            // one of the 62 enum values — see ENUMS doc
  entity_type String                                            // table-ish name: "lead", "ad_request", "user_badge", etc.
  entity_id   String
  before      Json?
  after       Json?
  note        String?
  created_at  DateTime        @default(now()) @db.Timestamptz(6)

  @@index([entity_type, entity_id, created_at(sort: Desc)])
  @@index([actor_type, actor_id, created_at(sort: Desc)])
  @@index([action, created_at(sort: Desc)])
  @@map("audit_log")
}
```

`action` is stored as `String` (not a Postgres enum) because the set is extended each sprint — see [ENUMS_AND_STATUS_CODES.md](ENUMS_AND_STATUS_CODES.md) §AuditAction. New mutations require adding to the TS union AND no DB migration.

---

## 3. Hard requirements

### A1 — Atomicity
Every mutation that writes a row to a domain table MUST also write its audit row in the **same `prisma.$transaction`**. If the data write rolls back, the audit row rolls back too. No partial commits. No fire-and-forget audit.

See the `tx()` table in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §3 — every row in that table includes `AuditLog` as one of the tables touched.

### A2 — Coverage
Every value in the `AuditAction` union ([lib/admin/types.ts](../../lib/admin/types.ts)) MUST be emitted by at least one repository function. The 9B QA gate verifies this — for each enum value, run the triggering action in staging and confirm one matching `audit_log` row exists.

Today's coverage is documented by `git grep "writeAudit" lib/`; 9B preserves it 1:1 and adds the four mutations that today bypass `writeAudit` (decision update — see open question §7).

### A3 — Snapshot fidelity
`before` and `after` MUST contain the **DTO** (repository return shape from `lib/<domain>/types.ts`), not the raw Prisma row. This prevents column renames or schema-internal field additions from leaking into audit history.

Implementation: a `toAuditSnapshot(entity)` helper per domain that strips internal fields. For most domains the DTO and Prisma row are identical and the helper is identity — but the contract makes the rule explicit.

### A4 — No PII in snapshots
`before.raw_phone`, `before.email`, `before.full_name`, etc. MUST NEVER appear in audit JSONB. Same banned-key list as tracking events ([lib/tracking/events.ts](../../lib/tracking/events.ts) `BANNED_PII_KEYS`). Repository helper `assertNoPii(snapshot)` runs before every `writeAudit` call.

### A5 — Indexes
Three indexes (declared in the Prisma model above):

1. `(entity_type, entity_id, created_at DESC)` — powers "show me the history of this lead/offer/topic".
2. `(actor_type, actor_id, created_at DESC)` — powers "show me what admin X did".
3. `(action, created_at DESC)` — powers "show me all `ad_request.reject` events in the last 24h".

These map directly to today's `ListAuditOptions` filter combinations.

### A6 — Retention
- **MVP (post-9B):** indefinite. No archival, no deletion. The volume is acceptable — every mutation writes one row, but mutations per day are in the thousands not millions.
- **Post-launch (parked):** when row count crosses ~10M, partition by month or archive `> 1 year` rows to cold storage. Out of scope for 9B.

### A7 — Read API stays the same
The repository's `listAuditLog({limit?, actor_id?, entity_type?, entity_id?, action?})` MUST return `AuditLogEntry[]` in the same shape as today. Internal admin views (`/admin/audit-log`, `GET /api/internal/audit-log`) work unchanged.

---

## 4. The 62-action enum — closed set policy

`AuditAction` ([lib/admin/types.ts](../../lib/admin/types.ts)) is a closed TS union of 62 values, grouped in [ENUMS_AND_STATUS_CODES.md](ENUMS_AND_STATUS_CODES.md) §AuditAction.

**Rule:** adding a new mutation requires adding an entry to the union in the same PR. Code review catches this — TypeScript's exhaustiveness check on `writeAudit({action: ...})` flags missing values.

**Why not a Postgres enum?** Two reasons:
1. Sprint-by-sprint extension means schema migrations every two weeks. String column avoids that overhead.
2. The values are dot-separated (`ad_request.label_change`) — already self-namespacing, so accidental typos are unlikely to collide with valid values.

The `(action, created_at)` index keeps filter queries fast despite the string type.

---

## 5. Cross-domain mutations — special audit rules

When a single repository call mutates more than one entity, the convention is to emit **multiple audit rows in the same `tx()`** — one per logical action.

| Repository function | Audit rows emitted |
|---|---|
| `transitionLead` → `to_state='official_offer'` | 1 × `LeadEvent` is durable in `lead_event` (not audit), 1 × `audit_log` for the state transition. Gamification badge grant (post-`tx()`) writes its own `badge.grant` row. |
| `updateAdRequest` with both `label` and `placement` changed | 1 × `ad_request.update` + 1 × `ad_request.label_change` + 1 × `ad_request.placement_change`. |
| `reviewPaymentProof` → `approved` | 1 × `payment.approve` + 1 × `invoice.mark_paid`. (Cascading ad activation, if it happens, writes `ad_request.activate` in its own follow-up call.) |
| `applyApprovedSubmission` | 1 × `submission.approve` + 1 × `offer.publish` (or `dealer.update`). |
| `updateDealer` with `verification_status` change | 1 × `dealer.update` + 1 × `dealer.verify`. The `DealerVerificationHistory` row is the durable trail; the audit row is the searchable index. |

This matches the pattern already in [lib/ads/store.ts](../../lib/ads/store.ts) `updateAdRequest` (which emits up to 3 audit rows for label/placement changes today) and [lib/dealer/submissions/store.ts](../../lib/dealer/submissions/store.ts) `applyApprovedSubmission` (which emits the `dealer.update`/`offer.publish` audit + the `submission.approve` audit).

---

## 6. What audit log is NOT used for

- **Replay / event sourcing.** The audit log is a *trail*, not a *log*. Don't reconstruct entity state from it.
- **Domain history users see.** Lead timeline (`lead_event` table), decision history (`decision_history_event`), and market-pulse snapshots are separate, user-facing history tables. The audit log is operator-facing.
- **Analytics.** Tracking events (`app/api/events/route.ts`) are the analytics surface and stay validate-and-drop per the sprint scope.

---

## 7. Open questions for 9B

1. **Decision update audit gap.** [lib/decisions/store.ts](../../lib/decisions/store.ts) `updateDecision` and `closeDecision` do not call `writeAudit` today (decisions are user-scoped and self-managed). Should 9B add audit emission for these? Recommendation: yes, with `actor_type='system'` and `actor_id=user_id`. Adds two enum values: `decision.update`, `decision.close`.
2. **Saved/Viewed audit.** Same question — currently no audit. Recommendation: skip. They're high-volume, low-forensic-value.
3. **Audit log read access.** Currently any authenticated admin reads any audit row. Should `viewer` role be restricted from sensitive entities (e.g., `OTPVerification`)? Out of scope for 9B unless the security team raises it.
4. **Audit row size.** If `before`/`after` get large (e.g., full `News.body`), should we truncate? Recommendation: yes — repository helper truncates JSONB values >4 KB to `"<truncated:original_size_bytes>"`.

---

## 8. Verification checklist (for the 9B audit-table cutover PR)

- [ ] `lib/admin/audit.ts` `writeAudit` now writes to `prisma.auditLog.create` (or no longer exists; callers use the repository).
- [ ] `listAuditLog` returns `AuditLogEntry[]` in the same shape as today.
- [ ] Sample mutation across each domain emits the expected audit row (verified manually in staging).
- [ ] Rollback test: simulate a `tx()` failure and assert zero audit row, zero data row, zero side effect.
- [ ] Three indexes exist (`\d audit_log` in psql shows them).
- [ ] No banned PII key appears in any sampled `before`/`after` JSONB on staging.
- [ ] Server restart preserves audit history.

---

## Future audit surfaces (addendum — not in 9B–9D)

Two future addendums add new `AuditAction` strings to the canonical `AuditLog` table. The `AuditLog` schema itself is **unchanged** — only the string set of `action` values grows. Atomicity rule A1 applies identically.

### VIN Check (Sprint 9E — see [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) §7)

New `action` values:
`vin_check_requested`, `vin_check_validated`, `vin_check_quota_checked`, `vin_check_cache_hit`, `vin_check_provider_dispatched`, `vin_check_completed`, `vin_check_failed`, `vin_check_blocked`, `vin_check_expired`, `vin_credit_granted`, `vin_credit_consumed`, `vin_credit_revoked`.

New `entity_type` values: `vin_check_request`, `vin_check_result`, `vin_check_credit`.

**PII rule (R1.4) extends:** `before`/`after` payloads MUST NOT contain `vin_hash`, raw VIN, or banned PII keys. `vin_last4`, `report_type`, `status`, `quota_source`, and the relevant IDs are allowed.

### i18n (Sprint 9F — see [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md) §8)

New `action` values:
`translation_drafted`, `translation_reviewed`, `translation_published`, `translation_unpublished`.

New `entity_type` values: `content_translation`, `car_spec_translation`, `seo_metadata_translation`, `translation_workflow`.

No new audit table. No change to the indexes or retention model.
