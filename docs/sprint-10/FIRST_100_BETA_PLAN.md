# Sprint 10 — First 100 Beta Plan

**Status:** Sprint 10J acquisition plan.
**Date:** 2026-05-18
**Scope:** closed beta — *not* public launch.
**Goal:** acquire and onboard the first 100 closed-beta users in a controlled, reversible way while staging/Vercel/Supabase are still paused. Use the local demo build + an external waitlist form. Collect structured feedback. Do not commit to SLAs.

This document is the operator-side playbook. User-facing copy lives in [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md). Feedback intake is in [BETA_FEEDBACK_SYSTEM.md](BETA_FEEDBACK_SYSTEM.md). Daily ops live in [FIRST_100_OPERATOR_CHECKLIST.md](FIRST_100_OPERATOR_CHECKLIST.md).

---

## 1. What this is, what it is not

**This beta is:**
- a controlled invitation to ~100 hand-picked users.
- a way to validate search / Nəsil / Komplektasiya / VIN beta / i18n beta / dealer offers against real intent.
- a feedback-gathering exercise.

**This beta is NOT:**
- a public launch — no press, no paid ads, no influencer push.
- a marketplace or peer-to-peer seller flow.
- a transactional product — no online payment, no escrow, no booking guarantee.
- a real VIN provider — VIN check is a beta risk signal.
- multi-language SEO — `/ru` and `/en` are not exposed.

**Hard limits (do not cross during the first 100):**
- no real VIN provider integration.
- no WhatsApp Business API.
- no online payment.
- no marketplace / private seller flow.
- no public route changes beyond a feature-flagged invite card.
- no Prisma migration.
- no Vercel / Supabase staging changes.

---

## 2. Target audience (the first 100)

Recruit in waves. Each wave is at most ~25 users; review after every wave.

| Cohort | Approx. share | Why | Source |
|---|---|---|---|
| Real car buyers in active search (0–3 months) | 30 | Highest signal-to-noise on relevance, price perception, trust. | Founder network, dealer customer referrals. |
| Used-car researchers | 20 | Tests filter / Nəsil / Komplektasiya / model-detail flows. | Auto Telegram channels, Facebook groups. |
| US-import buyers | 15 | Tests Carfax / VIN beta language, import flags. | Import-broker contacts, friends who imported. |
| EV / hybrid curious users | 10 | Tests fuel-type filters, cost-of-ownership messaging. | EV owner community, dealer EV inventory. |
| Dealer contacts | 10 | Cross-side validation of the consumer flow; recruits feedback from their staff & customers. | Existing beta dealers ([DEALER_BETA_ONBOARDING.md](DEALER_BETA_ONBOARDING.md)). |
| Automotive community / press / power-users | 8 | Editorial-quality feedback on tone, accuracy, premium feel. | Personal network, auto journalists. |
| Founder / team / first-degree network | 7 | Wave 0 dogfooding before the first external invite goes out. | Direct. |

Wave 0 (team + 1st-degree network, ~7 people) is mandatory before any external invite is sent.

---

## 3. Invite strategy

**Channels (in priority order):**
1. **Direct 1:1 message** (WhatsApp / Telegram / signal-private). Highest conversion, highest feedback quality. Default for the first 25.
2. **Curated group invites** (closed automotive group admins). Use only after wave 0 + at least one direct-invite wave.
3. **Dealer-routed invites** — dealers forward the waitlist link to interested customers. Document the dealer's referral source in the spreadsheet.
4. **Founder social** (LinkedIn / X / Instagram) — only after the first 50 are stable. Tone: "we are testing with a small group, here's the link to apply".

**Do not use:**
- paid ads.
- mass email blasts.
- public Discord / Reddit pushes.
- influencer campaigns.

**Channel guardrails:**
- one channel per wave — if wave 1 is direct WhatsApp, do not also seed Telegram groups in the same 48 h.
- track the source per invitee (see §6).

---

## 4. Onboarding flow (user-side)

1. User receives an invite message (see [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §WhatsApp invite).
2. User clicks the waitlist link (external Google Form / Tally / Typeform — URL stored in `NEXT_PUBLIC_BETA_WAITLIST_URL`).
3. User completes the form (3–5 fields: name, contact, intent, car of interest, source).
4. Operator reviews the submission within 24 h.
5. Operator approves and sends the **welcome message** (see [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §welcome) with:
   - link to the local demo / staging-when-ready URL.
   - the disclaimer ("beta · məhdud yerlər · geribildirim tələb olunur").
   - the feedback form link (`NEXT_PUBLIC_BETA_FEEDBACK_URL`).
6. User explores the product.
7. After ~3 days, operator sends a **feedback nudge** ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §feedback nudge).

No app-side account creation step is added in this sprint. We rely on the existing auth flow only where it already exists; the waitlist is external.

---

## 5. What users should test (priority order)

1. **Search & filter** — `/cars` results, marka / model / Nəsil / Komplektasiya, fuel type, year, price.
2. **Decision helper** — does the homepage decision card move them forward?
3. **Listing detail** — spec accuracy, price clarity, dealer attribution.
4. **VIN beta** (if `NEXT_PUBLIC_FEATURE_VIN_BETA=true`) — does the disclaimer read clearly? Does the format-validation feel useful?
5. **i18n beta** (if `NEXT_PUBLIC_FEATURE_I18N_BETA=true`) — does the AZ/RU/EN selector work without breaking the layout?
6. **Test drive / lead form** — flow from listing to lead submit.
7. **Mobile experience** at 390 px and 360 px widths.
8. **Trust signals** — does the homepage convey "this is real and safe to use"?

Out-of-scope for testing in this wave: payment, marketplace listings, WhatsApp Business chat-through, multi-language SEO landing pages.

---

## 6. What feedback to collect

Tracked in a single spreadsheet (Airtable / Google Sheet). One row per invitee:

| Column | Notes |
|---|---|
| invite_id | sequential, 1..100 |
| name | first name only, or alias |
| contact | WhatsApp/Telegram handle — never publish |
| cohort | one of §2 cohorts |
| source | channel + person who routed them |
| invited_at | YYYY-MM-DD |
| waitlist_submitted_at | YYYY-MM-DD or blank |
| approved_at | YYYY-MM-DD or blank |
| first_session_at | from operator nudge / direct ack |
| feedback_received_at | YYYY-MM-DD or blank |
| feedback_summary | 1–2 sentence operator summary |
| critical_bug | true/false (see [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md)) |
| status | invited / submitted / approved / active / inactive / dropped |
| notes | anything unusual |

Categorical bug taxonomy is in [BETA_FEEDBACK_SYSTEM.md](BETA_FEEDBACK_SYSTEM.md).

---

## 7. Success metrics

The first 100 is a learning exercise, not a growth funnel. Targets are advisory.

| Metric | Target | How to measure |
|---|---|---|
| Invites sent | 100 | spreadsheet row count |
| Waitlist conversion | ≥ 60 % | submitted / invited |
| Approved & welcomed | ≥ 50 % of invited | approved / invited |
| First session within 72 h of welcome | ≥ 60 % of approved | operator nudge ack |
| Feedback submitted | ≥ 30 (qualitative is fine) | feedback form + DM replies |
| Critical bugs | 0 unresolved > 48 h | bug triage doc |
| Critical-bug-driven pause | 0 events lasting > 24 h | operator decision log |

If conversion < 30 % after two waves, pause invites and re-read the copy and channel mix.

---

## 8. Beta limitations to communicate

These must appear in the welcome message and on the homepage CTA subtext:

- **Qapalı beta.** Yalnız dəvətli istifadəçilər.
- **Məhdud yerlər.** Yalnız ilk 100.
- **Geribildirim tələb olunur.** Hər istifadəçidən ən azı bir geri-bildirim gözlənilir.
- **Onlayn ödəniş yoxdur.** Bütün ödənişlər diler ilə birbaşa.
- **VIN yoxlaması beta-dır** — ekspert yoxlamasını əvəz etmir.
- **Mobil 390 px-də sınanmışdır.**

---

## 9. Escalation rules

| Trigger | Action |
|---|---|
| Critical bug found (data loss / wrong price / security) | **Pause invites immediately.** Open ticket per [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md). Communicate via [FIRST_100_OPERATOR_CHECKLIST.md](FIRST_100_OPERATOR_CHECKLIST.md) §pause template. |
| Dealer complains about lead quality / accuracy | Operator + founder review the dealer's last 5 leads same day. |
| 3+ users report the same UX confusion | Add to backlog as a Sprint 10K candidate fix. Do not hotfix during a wave unless it blocks task completion. |
| User asks to be removed | Remove from spreadsheet within 24 h. Confirm in writing. No further messages. |
| Press / public mention before wave 3 | Politely decline, do not amplify. "We are still in closed beta." |
| Waitlist URL goes down | The CTA degrades to the disabled "tezliklə aktiv olacaq" state automatically (env-based). No code redeploy needed. |

---

## 10. Exit criteria from "First 100 beta"

The First 100 phase is complete when **all** of the following hold:

- ≥ 50 approved users have had at least one session.
- ≥ 30 distinct feedback submissions reviewed.
- No unresolved critical bugs.
- Operator + founder have signed off on a "Sprint 10K / open-beta" plan.

Only then do we widen the invite, lift the cap, or consider public-launch prep (Vercel / Supabase staging unfreeze).
