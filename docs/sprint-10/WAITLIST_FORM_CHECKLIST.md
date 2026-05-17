# Sprint 10 — Waitlist Form Checklist

**Status:** Wave 0 operator checklist for the external waitlist intake form.
**Date:** 2026-05-18
**Form hosting:** Google Forms or Tally — same constraint as [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md). No backend storage on Zolaq servers in Sprint 10.

This file is **not** a full form spec — it is the operator's gate before pointing `NEXT_PUBLIC_BETA_WAITLIST_URL` (see [.env.example](../../.env.example) lines 93–112) at the external form. Walk this checklist top-to-bottom; every checkbox must be true before the URL goes live.

---

## 1. Purpose

The waitlist form is the only external link sent in [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md). It captures intent and a contact handle so the operator can:

- Approve testers manually.
- Send the follow-up welcome / nudge messages from [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md).
- Track cohort source per invitee.

It does **not** capture bug reports — that is the feedback form (see [FEEDBACK_FORM_CHECKLIST.md](./FEEDBACK_FORM_CHECKLIST.md)).

---

## 2. Recommended fields (in order)

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Name | Short text | ✅ | First name is fine; do not force full name. |
| 2 | Phone or contact handle | Short text | ✅ | Free-form so the user can pick WhatsApp number, Telegram handle, or email. Do not split into separate fields — that pushes users into a channel they may not use. |
| 3 | Car of interest | Short text | ✅ | Free text — make / model / year range, whatever the user wants to write. Do **not** force a brand dropdown (incomplete catalog in Sprint 10). |
| 4 | Buying timeline | Single choice | ✅ | Options: `0–1 month` / `1–3 months` / `3–6 months` / `Just researching`. |
| 5 | Current car-research problem | Long text | ✅ | 1–3 sentences. This is the single most-valuable free-text field — keep it; this is where signal lives. |
| 6 | Dealer / user type | Single choice | ✅ | Options: `Private buyer` / `Dealer staff` / `Industry / press` / `Other`. Drives downstream cohort sorting (see [FIRST_100_BETA_PLAN.md](./FIRST_100_BETA_PLAN.md) §2). |
| 7 | Permission to contact | Checkbox | ✅ | Exact label: *"Zolaq qapalı beta haqqında mənimlə əlaqə saxlaya bilər."* Must be unchecked by default. |
| 8 | Notes (optional) | Long text | ⬜ | Catch-all. |

That's it — 8 fields, 7 required, ~2 minutes to complete. Resist adding more.

---

## 3. Privacy rules (must enforce)

These are **hard rules** — every one must be true. They mirror the hard limits in [FIRST_100_BETA_PLAN.md](./FIRST_100_BETA_PLAN.md) §1 and the privacy posture in [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md).

- [ ] **Do not** ask for sensitive documents (passport scan, driver license, registration card).
- [ ] **Do not** ask for passport number, FIN, ID card number, or any government identifier.
- [ ] **Do not** ask for payment data (card number, bank details, IBAN).
- [ ] **Do not** ask for VIN in the waitlist form — VIN belongs to the in-product VIN beta surface, not the intake form. (See [HomeVinBetaCard.tsx](../../components/home/HomeVinBetaCard.tsx) and the disclaimer in [VinCheckBetaModal.tsx](../../components/vin/VinCheckBetaModal.tsx).)
- [ ] **Do not** store waitlist submissions on Zolaq servers in Sprint 10. The external form host (Google Forms / Tally) is the system of record; the operator exports to a private spreadsheet.
- [ ] **Do not** enable Google Form's "collect email addresses automatically" option — the contact handle field is the user's explicit choice.
- [ ] **Do not** require a Google account to submit (Google Forms setting: "Limit to 1 response" off).

---

## 4. Top-of-form disclaimer (AZ, ≤ 2 lines)

Paste this verbatim as the first thing the form shows, above field 1:

> Zolaq qapalı beta-dadır. Məhdud yerlər. Geribildirim tələb olunur.
> Onlayn ödəniş yoxdur, satış zəmanəti yoxdur, sizinlə yalnız qeyd etdiyiniz kanal üzərindən əlaqə saxlanılır.

Why it matters: Wave 0 success criteria (see [WAVE_0_INTERNAL_BETA_PLAN.md](./WAVE_0_INTERNAL_BETA_PLAN.md) §9) include "the waitlist form disclaimer is correctly understood by every tester who completes it." If the disclaimer is buried below the fold, that criterion will fail.

---

## 5. Operator-side hygiene

Daily ops live in [FIRST_100_OPERATOR_CHECKLIST.md](./FIRST_100_OPERATOR_CHECKLIST.md); the waitlist-specific minimum is:

1. **Export** waitlist responses at least once per working day during Wave 0.
2. **Log** each row in the operator spreadsheet with: submission timestamp, cohort tag (from field 6), source channel (which WhatsApp / Telegram thread brought them in), approval status (pending / approved / declined), date of welcome message.
3. **Approve** within 24 h of submission.
4. **Decline politely** if the submission obviously does not fit Wave 0 (e.g., off-topic, spam) — use the AZ decline line: *"Hələ ki sizi siyahıya əlavə edə bilmirik, sonrakı dalğada yenidən baxılacaq."* (No decline message is sent in Sprint 10 if you cannot personalize it.)
5. **Never** publish or share the spreadsheet. It contains contact handles.
6. **Delete** Google Form / Tally responses at the end of beta or after migration to a real CRM, whichever comes first.

---

## 6. Pre-flight checklist (do this before you set `NEXT_PUBLIC_BETA_WAITLIST_URL`)

- [ ] Form created on Google Forms or Tally.
- [ ] All 8 fields present, in order, with the right required flags.
- [ ] Top-of-form disclaimer pasted verbatim.
- [ ] All 7 privacy rules from §3 satisfied.
- [ ] Form preview opens cleanly on mobile (390 px width).
- [ ] Submit confirmation message shown (AZ): *"Təşəkkürlər. 24 saat ərzində sizə yazacağıq."*
- [ ] Test submission made by the operator and visible in the response sheet.
- [ ] URL copied; ready to paste into `.env.local` as `NEXT_PUBLIC_BETA_WAITLIST_URL`.

Once all are checked, the URL can go live. Until then, the `HomeBetaInviteCard` falls back to the safe disabled state (see [HomeBetaInviteCard.tsx](../../components/home/HomeBetaInviteCard.tsx)) and Wave 0 invites use the "link tezliklə hazırdır" fallback from [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) §3.
