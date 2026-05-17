# Sprint 10 — Feedback Form Checklist

**Status:** Wave 0 operator checklist verifying the feedback form covers every Wave 0 risk area.
**Date:** 2026-05-18
**Full form template:** [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md) — this checklist is the **one-page gate**, not a re-spec.
**Intake system:** [BETA_FEEDBACK_SYSTEM.md](./BETA_FEEDBACK_SYSTEM.md).
**Severity rubric:** [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md).

This file is the operator's check before pointing `NEXT_PUBLIC_BETA_FEEDBACK_URL` (see [.env.example](../../.env.example) lines 93–112) at the external form. Walk the table; every category must have a concrete answerable question in the form.

---

## 1. Categories the feedback form must cover

Every Wave 0 tester sees the same form. The form must give them a way to report each of the following without thinking hard about which field to use.

| # | Category | One example question the form must contain |
|---|---|---|
| 1 | Search / filter | *"Did `/cars` return the cars you expected for your filters?"* (long text) |
| 2 | Missing car data | *"Was there a car (make / model / generation) you searched for but did not find?"* (long text) |
| 3 | Wrong spec / price | *"Did you see a spec or price that looked wrong? Which listing?"* (long text + optional URL) |
| 4 | VIN beta | *"If you tried VIN check: was the disclaimer clear? Did you understand it is a risk signal, not an expert check?"* (long text) |
| 5 | Language | *"Was any AZ wording unclear? If i18n beta is on, did the AZ/RU/EN selector behave correctly?"* (long text) |
| 6 | Mobile | *"On your phone, was anything broken at 390 px or 360 px width? Which screen?"* (long text + device field) |
| 7 | Dealer flow | *"If you interacted with a dealer profile or lead form, what was unclear?"* (long text) — applies even to non-dealers, since they see dealer attribution on listings. |
| 8 | Admin flow | *"(Only if you have admin access in this demo) — what felt wrong in the admin area?"* (long text, optional). Reserved for testers in the dealer-staff / industry slot. |
| 9 | Confusing UX | *"Was there a moment you stopped and did not know what to do next? Which screen?"* (long text) |
| 10 | Bug (general) | *"Anything that looked broken — a button that did nothing, an error, a layout glitch?"* (long text + screenshot upload) |
| 11 | Feature request | *"Is there something obvious that is missing? One sentence is enough."* (long text) |

Each row must map to at least one **answerable** field in the live form. If a category has no field, **add one before sending the form to Wave 0 testers**.

---

## 2. What the form already covers (cross-reference)

Existing template in [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md) maps roughly as follows. Verify each mapping is still true in the live form before launch.

| Wave 0 category | Covered by `CLOSED_BETA_FEEDBACK_FORM.md` section |
|---|---|
| 1, 2, 3 (search / data / spec) | §2 (Where it happened) + §3 (What happened) |
| 4 (VIN beta) | §2 page selector includes "Car detail" / "Other" — confirm a `VIN beta` option is present |
| 5 (language) | not explicitly covered in current template — **add** a single-choice or free-text item |
| 6 (mobile) | §5 (Environment) device + width |
| 7 (dealer flow) | §2 page selector includes "Dealer profile" / "Lead form" |
| 8 (admin flow) | not in current template — **add** an optional item gated by tester role |
| 9 (confusing UX) | §1 type = "Friction point" + §3 free text |
| 10 (bug) | §1 type = "Bug" + §4 attachments |
| 11 (feature request) | §1 type = "Feature request" |

**Adds required before launch:** category 5 (language) and category 8 (admin flow). These are one-line additions to the existing form, not new sections.

---

## 3. Privacy / scope rules (mirror waitlist form)

- [ ] **Do not** ask for personal identifiers (passport, FIN, payment data) — same rule as [WAITLIST_FORM_CHECKLIST.md](./WAITLIST_FORM_CHECKLIST.md) §3.
- [ ] **Do not** require the tester to log in to submit.
- [ ] **Do not** require an attachment — screenshots are optional.
- [ ] Tester ID field, if present, is **optional**.

Top-of-form privacy block from [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md) §"Privacy note" is the authoritative wording; paste it verbatim.

---

## 4. Wave 0 triage SLA

For the 5–7 person Wave 0 sample (see [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md) §2), the commitment is:

- **24-hour read-through** of every submission.
- **No fix SLA** is promised to testers.
- **P0 bugs** (see [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md) for the rubric) trigger a Wave 0 pause per [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md) §7 — fix before sending any new invite.
- **P1 / P2 / P3** go to the backlog; the tester gets a one-line acknowledgement only if the operator has bandwidth.

This is intentional. The point of Wave 0 is to surface problems, not to ship a hot-fix train.

---

## 5. Pre-flight checklist (do this before you set `NEXT_PUBLIC_BETA_FEEDBACK_URL`)

- [ ] Full template from [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md) implemented on Google Forms / Tally.
- [ ] All 11 categories from §1 have at least one mapped field.
- [ ] Language (§1 row 5) and Admin flow (§1 row 8) additions made.
- [ ] Privacy block pasted verbatim at the top of the form.
- [ ] No required field forces a personal identifier.
- [ ] Form opens cleanly on mobile (390 px).
- [ ] Submit confirmation message shown (AZ): *"Geribildirim qəbul olundu. Təşəkkürlər."*
- [ ] Test submission made by the operator and visible in the response sheet.
- [ ] URL copied; ready to paste into `.env.local` as `NEXT_PUBLIC_BETA_FEEDBACK_URL`.

Once all are checked, the URL can be referenced in the Wave 0 welcome message (see [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md)) and the follow-up nudge (see [WAVE_0_INVITE_MESSAGES.md](./WAVE_0_INVITE_MESSAGES.md) §6).
