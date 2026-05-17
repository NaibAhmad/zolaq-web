# Sprint 10 — Wave 0 Internal Beta Plan

**Status:** Wave 0 operator playbook (post Sprint 10J acceptance).
**Date:** 2026-05-18
**Scope:** internal dogfooding — 5–7 trusted testers — **before** any external invite is sent.
**Sibling docs:** [FIRST_100_BETA_PLAN.md](./FIRST_100_BETA_PLAN.md) (full 100-user playbook),
[FIRST_100_OPERATOR_CHECKLIST.md](./FIRST_100_OPERATOR_CHECKLIST.md) (daily ops),
[FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) (full AZ copy bank),
[WAITLIST_FORM_CHECKLIST.md](./WAITLIST_FORM_CHECKLIST.md),
[FEEDBACK_FORM_CHECKLIST.md](./FEEDBACK_FORM_CHECKLIST.md),
[WAVE_0_INVITE_MESSAGES.md](./WAVE_0_INVITE_MESSAGES.md).

---

## 1. What Wave 0 is, what it is not

**Wave 0 is:**
- a 5–7 person internal dogfooding wave.
- the **mandatory gate** before any external invite (Wave 1 onward) is sent.
- a one-time exercise to validate: invite copy, waitlist form, feedback form, local demo flow, and tester comprehension of the closed-beta disclaimer.

**Wave 0 is not:**
- a public launch — no social posts, no press, no paid ads.
- a marketing wave — invitees are recruited 1:1 from the founder's direct network.
- a staging release — staging / Vercel / Supabase remain frozen this sprint.
- a usability study with metrics — qualitative only.

**Hard limits (same as [FIRST_100_BETA_PLAN.md](./FIRST_100_BETA_PLAN.md) §1):** no real VIN provider, no WhatsApp Business API, no online payment, no marketplace / private-seller flow, no Prisma migration, no `/ru` or `/en` public route.

---

## 2. Target invitees (5–7 people)

Names are left to the operator. These are **slots, not identities** — fill each with one trusted person from the founder's direct network.

| # | Slot | Why this slot exists |
|---|---|---|
| 1 | Founder / team member | Sanity-check end-to-end before anyone external touches it. |
| 2 | Trusted developer or designer | Catch UX / copy / layout issues a non-buyer notices. |
| 3 | Real car buyer in active search (0–3 months) | Highest-signal feedback on relevance, price clarity, dealer attribution. |
| 4 | Dealer contact | Cross-side validation; sanity-check that the consumer flow does not undermine dealers. |
| 5 | EV / hybrid curious user | Stress fuel-type filters and cost-of-ownership messaging. |
| 6 | US-import curious user | Stress VIN beta language and import flag wording. |
| 7 | Auto-community power user (optional) | Editorial-quality feedback on tone, accuracy, premium feel. |

If slot 7 cannot be filled in time, ship Wave 0 with 6 testers. **Do not go below 5.**

---

## 3. What testers should test (priority order)

A one-session pass, ~20 minutes per tester. Mirrors [FIRST_100_BETA_PLAN.md](./FIRST_100_BETA_PLAN.md) §5 trimmed for Wave 0 scope.

1. **Search / filter on `/cars`** — marka / model / Nəsil / Komplektasiya, fuel type, year, price range.
2. **Decision helper** on the homepage — does it move the tester toward a next step?
3. **Listing detail** — spec accuracy, price clarity, dealer attribution.
4. **VIN beta** (only if `NEXT_PUBLIC_FEATURE_VIN_BETA=true`) — is the disclaimer ("risk signal, not an expert check") read and understood?
5. **i18n selector** (only if `NEXT_PUBLIC_FEATURE_I18N_BETA=true`) — does AZ/RU/EN toggle work in the header + homepage Quick Search without breaking layout? (Rest of the app is intentionally AZ-only this sprint.)
6. **Test-drive / lead form** — flow from listing to lead submit.
7. **Mobile** at 390 px and 360 px widths.

Per-tester observations go in the [FOUNDER_LOCAL_QA_SHEET.md](./FOUNDER_LOCAL_QA_SHEET.md) row template (one row per tester).

---

## 4. What link / form to use

**Wave 0 sends exactly one external link to each tester: the waitlist form URL.**

- The URL is stored in `.env.local` as `NEXT_PUBLIC_BETA_WAITLIST_URL` (see [.env.example](../../.env.example) lines 93–112).
- The form host is Google Forms or Tally (see [WAITLIST_FORM_CHECKLIST.md](./WAITLIST_FORM_CHECKLIST.md)).
- No public Zolaq URL is shared in Wave 0. The product is only accessible via founder screenshare or, later, a sent-by-DM staging link (see §8).

**If `NEXT_PUBLIC_BETA_WAITLIST_URL` is empty when Wave 0 starts:**
- Use the fallback line from [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) §3: *"Link tezliklə hazırdır — sizə şəxsən göndərəcəyəm."*
- Collect intent over WhatsApp / Telegram DM and log it in the operator spreadsheet.
- Do not send any invite that implies a public URL exists.

---

## 5. What feedback to collect

Two channels, both off-platform:

1. **Waitlist form** — see field list in [WAITLIST_FORM_CHECKLIST.md](./WAITLIST_FORM_CHECKLIST.md). Captures intent and contact handle. **Not** for bug reports.
2. **Feedback form** — see category checklist in [FEEDBACK_FORM_CHECKLIST.md](./FEEDBACK_FORM_CHECKLIST.md), full template in [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md). Captures bug / UX / feature feedback.

Plus, one **operator-side note** per tester in [FOUNDER_LOCAL_QA_SHEET.md](./FOUNDER_LOCAL_QA_SHEET.md): "what did this person stumble on, in one line".

Triage rubric: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md). Wave 0 commits to a 24-hour read-through of each report; **does not** commit to fix SLAs.

---

## 6. Duration

**Hard cap: 5–7 days from the first invite.**

- Day 0 — first invites go out (max 2 invites the first day, to catch any embarrassing copy bug).
- Days 1–3 — rolling invites; up to 7 total.
- Days 3–5 — testing happens; first follow-up nudge at 48–72 h (see [WAVE_0_INVITE_MESSAGES.md](./WAVE_0_INVITE_MESSAGES.md) §6).
- Days 5–7 — feedback review, triage, decision.

If Wave 0 is not complete in 7 days, **pause** and review (see §7) rather than extend silently.

---

## 7. When to pause

Pause Wave 0 (do **not** advance to Wave 1) if any of the following is true:

- A **P0 bug** is reported (definition: blocks core search, lead form, or auth). See severity rubric in [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md).
- **Two or more testers misread the disclaimer** (e.g., think Zolaq guarantees a price, sells cars directly, or replaces an expert VIN check). Copy is the problem; rewrite before continuing.
- The **AZ invite copy is rejected** by any native-speaker tester as off-tone or unclear.
- **Fewer than 3 testers** complete a feedback round by day 5.
- A **privacy concern** is flagged (e.g., a tester is uncomfortable with the contact-permission language).

Pause means: stop sending new invites, fix the root cause, and re-run Wave 0 partially or fully.

---

## 8. Local demo share — two options (staging is paused)

Since there is no public Zolaq URL in Sprint 10, Wave 0 uses one of two share modes. **Pick one per tester; document the choice in the operator spreadsheet.**

### Option A — Founder screenshares local demo

1. Founder runs `npm run dev` and opens `http://localhost:3000` on a clean browser profile.
2. Schedule a 20-minute video call with the tester (Zoom / Google Meet / WhatsApp call).
3. Walk through [LOCAL_DEMO_PRESENTATION_FLOW.md](./LOCAL_DEMO_PRESENTATION_FLOW.md) — 18 steps, founder narrates, tester reacts.
4. Record observations in [FOUNDER_LOCAL_QA_SHEET.md](./FOUNDER_LOCAL_QA_SHEET.md).
5. End the call with the waitlist + feedback form links.

**Use Option A for:** the developer/designer slot, the dealer contact, and any tester whose feedback is best captured live.

### Option B — Collect waitlist first, send staging link later

1. Send the Wave 0 invite (see [WAVE_0_INVITE_MESSAGES.md](./WAVE_0_INVITE_MESSAGES.md)) with **only** the waitlist URL.
2. Tester completes the waitlist form; operator reviews within 24 h.
3. **Do not send any live URL yet** — staging is paused. The invite copy must be honest: *"link will follow in a later wave"*.
4. When staging is unfrozen in a future sprint, the tester receives a personal DM with the staging link and the feedback form.

**Use Option B for:** the real car buyer, the EV / hybrid user, the US-import user, and the auto-community power user — anyone whose feedback is more valuable after self-paced exploration than during a guided demo.

**Explicit in both options:** no public URL is shared in Wave 0. No invite message implies one exists.

---

## 9. Success criteria (exit condition for Wave 0)

All of the following must be true to advance to Wave 1:

- At least **4 of 5–7 testers** complete the waitlist form.
- At least **3 testers** submit feedback (form or 1:1 message captured in the operator log).
- **Zero P0 / blocking bugs** are open at the end of Wave 0.
- **No privacy concern** is flagged unresolved.
- The AZ invite copy is **read cleanly by all native speakers** in the wave (no rewrite request).
- The waitlist form **disclaimer is correctly understood** by every tester who completes it.

If all six are satisfied, mark **Wave 0 PASS** in the operator log and proceed per [FIRST_100_OPERATOR_CHECKLIST.md](./FIRST_100_OPERATOR_CHECKLIST.md). If any fail, mark **Wave 0 HOLD** and address the root cause before sending Wave 1.

---

## 10. Exit & handoff to Wave 1

Before Wave 1 begins:

- All Wave 0 feedback is triaged (see [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)).
- Any copy rewrites are reflected in [FIRST_100_BETA_COPY.md](./FIRST_100_BETA_COPY.md) and [WAVE_0_INVITE_MESSAGES.md](./WAVE_0_INVITE_MESSAGES.md).
- The waitlist form and feedback form are confirmed against [WAITLIST_FORM_CHECKLIST.md](./WAITLIST_FORM_CHECKLIST.md) and [FEEDBACK_FORM_CHECKLIST.md](./FEEDBACK_FORM_CHECKLIST.md).
- The local demo build still passes the four gates documented in [LOCAL_DEMO_FREEZE_REPORT.md](./LOCAL_DEMO_FREEZE_REPORT.md): `npx prisma validate`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

Handoff: Wave 1 cohort selection follows [FIRST_100_BETA_PLAN.md](./FIRST_100_BETA_PLAN.md) §2 (target audience table). Daily ops follow [FIRST_100_OPERATOR_CHECKLIST.md](./FIRST_100_OPERATOR_CHECKLIST.md).
