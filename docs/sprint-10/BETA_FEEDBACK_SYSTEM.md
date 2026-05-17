# Sprint 10 — Beta Feedback System

**Status:** Sprint 10J feedback intake plan.
**Date:** 2026-05-18
**Scope:** v1 feedback collection for the first 100 closed-beta users. **No backend feedback storage in this sprint.** All intake routes through an external form + manual operator review. The app-side surface is a single env-driven URL.

This pairs with [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md), [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md), [FIRST_100_OPERATOR_CHECKLIST.md](FIRST_100_OPERATOR_CHECKLIST.md), and [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md).

---

## 1. Why no backend yet

- Safer: no PII storage path, no GDPR/AZ-PDPL exposure, no schema migration.
- Faster: a hosted form (Google Forms / Tally / Typeform / Airtable) ships in 30 min, with built-in spam protection and CSV export.
- Reversible: pulling the URL from the env disables intake instantly without a redeploy.
- The first 100 will produce ≤ 200 entries — Excel-tier volume.

We will reconsider an in-app feedback widget + DB after the First 100 phase exits cleanly (see [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md) §10).

---

## 2. Where feedback is collected

| Surface | Mechanism | Notes |
|---|---|---|
| External waitlist + feedback form | `NEXT_PUBLIC_BETA_FEEDBACK_URL` — Google Form / Tally / Typeform / Airtable | Primary intake. Linked from welcome and nudge messages. |
| Direct DM reply | WhatsApp / Telegram | Operator transcribes into the spreadsheet within 24 h. |
| Dealer-routed | Dealer relays user feedback | Operator confirms with the dealer in writing before logging. |
| Critical-bug hotline | Founder phone / WhatsApp (operator-owned) | **Do not hardcode the number in the app.** Shared only in welcome message when needed. |

**Not collected this sprint:**
- analytics events on a "feedback" button click — there is no in-app button.
- in-product NPS or CSAT widgets.
- session recordings or heat-maps.

---

## 3. Feedback categories

The external form must offer **one** required category dropdown per submission. The categories are:

| ID | Label (AZ) | Operator description | Routes to |
|---|---|---|---|
| `search_filter` | Axtarış / Filtr problemi | Wrong results, missing filter, broken sort, empty results when results expected. | Sprint 8H regression check first. |
| `missing_data` | Çatışmayan avtomobil / məlumat | A car the user expected to see is missing, or a listing is missing fields. | Admin data-fill backlog ([MASTER_ADMIN_DATA_FILL_SOP.md](MASTER_ADMIN_DATA_FILL_SOP.md)). |
| `wrong_spec_price` | Yanlış spesifikasiya / qiymət | A listed price, year, mileage, or spec is wrong. | Admin urgent fix queue + dealer contact. |
| `dealer_issue` | Diler problemi | Slow response, rude, unreachable, wrong info, suspicious behavior. | Operator + dealer-onboarding contact. |
| `vin_beta` | VIN beta geribildirimi | VIN modal copy, disclaimer clarity, false-positive risk reads. | Sprint 9H VIN beta backlog. |
| `language` | Dil / tərcümə problemi | Wrong AZ word, typo, broken AZ↔RU↔EN switch. | i18n backlog ([I18N_BETA_SCOPE.md](I18N_BETA_SCOPE.md)). |
| `mobile` | Mobil problemi | Layout broken, overflow, tap target too small. | Frontend QA — 390 px / 360 px first. |
| `confusing_ux` | Qarışıq UX | The user couldn't figure out where to go next; not a bug, but a clarity gap. | Design backlog. |
| `bug` | Texniki səhv | Visible error, broken button, missing image, crash. | [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md). |
| `feature_request` | Yeni funksiya təklifi | "Burada əlavə etsəniz yaxşı olardı". | Long-term backlog — do not act in this sprint. |

The form must also collect (all optional except the first):
- category (required, dropdown above)
- short summary (required, 1–2 sentences)
- screenshot (optional, file upload)
- page URL (optional, free text)
- device (optional, single-select: mobile / tablet / desktop)
- contact handle (optional — only if user wants follow-up)

**Do not** ask for: full name, email, phone, ID, address. Contact handle is opt-in only.

---

## 4. Severity ladder

Each operator-reviewed entry is tagged with one severity. Mirrors [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md).

| Severity | Definition | SLA (operator) |
|---|---|---|
| S0 — critical | Data loss, wrong price published, security exposure, auth break. | Pause invites, fix or rollback within 24 h. |
| S1 — high | Core flow broken (search returns nothing, lead form silently drops). | Fix within 72 h. Communicate ETA. |
| S2 — medium | Visible bug, recoverable. Wrong filter, missing image, copy typo affecting trust. | Fix in next sprint. |
| S3 — low | Cosmetic, suggestion, minor wording. | Backlog only. |

If a user reports the same S0/S1 twice from different cohorts within 48 h, escalate to founder.

---

## 5. Review cadence

| When | Who | What |
|---|---|---|
| Daily, 09:00 local | Operator | Pull new form submissions. Triage into the spreadsheet. Reply to S0/S1 within 4 h. |
| Daily, end-of-day | Operator | Update [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md) §6 spreadsheet `feedback_received_at` + `feedback_summary` per user. |
| Every 10 active users | Operator + founder | 15-min sync on themes, blockers, copy gaps. |
| Weekly | Founder | Decide what enters Sprint 10K. |
| On S0 | Operator + founder | Pause invites immediately. Use the pause message in [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §8. |

---

## 6. Spreadsheet schema (feedback tab)

Separate tab from the invite tracker. Columns:

| Column | Notes |
|---|---|
| feedback_id | sequential |
| received_at | YYYY-MM-DD HH:MM, local time |
| source | form / DM / dealer |
| invite_id | link to invite tracker row, blank for anonymous |
| category | one of §3 IDs |
| severity | S0 / S1 / S2 / S3 |
| summary | operator-edited 1-line summary |
| device | optional |
| page_url | optional |
| screenshot_url | from form, or operator-uploaded link |
| owner | who triages |
| status | new / in-review / fixed / wont-fix / dup |
| follow_up_sent_at | YYYY-MM-DD, blank if not needed |
| linked_ticket | bug-tracker ID if escalated |

---

## 7. Privacy & data handling

- The external form is the source of truth. **No feedback content is mirrored into the Zolaq app database in this sprint.**
- Do not log contact handles in any public artifact (commit, screenshot, slide deck).
- If a user requests removal, delete their form submission **and** the corresponding spreadsheet row within 24 h.
- The form URL itself is in `NEXT_PUBLIC_BETA_FEEDBACK_URL` — public by definition. The form must be configured to accept submissions without sign-in (Google Forms: "Anyone with the link").
- Do not enable Google Forms' "collect email addresses" toggle — it forces respondent sign-in and adds PII we don't need.

---

## 8. Migration path (out of scope this sprint, documented for continuity)

When the First 100 phase exits and we plan in-app feedback:

1. Add a `BetaFeedback` Prisma model (Sprint 10K candidate).
2. Add a `/api/feedback` route with rate-limit + spam protection.
3. Add an authenticated admin view at `/admin/feedback`.
4. Backfill historical entries from the spreadsheet CSV.
5. Keep the external form alive for one full sprint as a fallback.

Do not start any of this in Sprint 10J.

---

## 9. Acceptance for this sprint

- [ ] External feedback form is created on an allowed provider (Google Form / Tally / Typeform / Airtable).
- [ ] The form requires only the category + short summary fields; the rest are optional.
- [ ] `NEXT_PUBLIC_BETA_FEEDBACK_URL` is documented in [.env.example](../../.env.example).
- [ ] The feedback URL is included in the welcome and nudge messages ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md)).
- [ ] The spreadsheet (invite tab + feedback tab) is created and accessible to the operator + founder.
- [ ] No personal data is hardcoded in the repo (phone, email, founder handle).
- [ ] No backend feedback model is added to Prisma.
