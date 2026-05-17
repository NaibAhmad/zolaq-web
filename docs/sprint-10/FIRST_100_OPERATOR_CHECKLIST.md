# Sprint 10 — First 100 Operator Checklist

**Status:** Sprint 10J daily operations playbook.
**Date:** 2026-05-18
**Audience:** the operator running the First 100 closed beta (initially the founder).
**Purpose:** turn the strategy in [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md) into per-step actions. Pair with [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) and [BETA_FEEDBACK_SYSTEM.md](BETA_FEEDBACK_SYSTEM.md).

---

## 0. One-time setup (before any invite goes out)

- [ ] Create the external waitlist form on an allowed provider (Google Form / Tally / Typeform / Airtable).
  - required fields: name, contact handle, intent, car of interest, source.
  - **disable** "collect email addresses" if using Google Forms.
- [ ] Create the external feedback form (can be the same provider, separate form).
  - required field: category (dropdown — list from [BETA_FEEDBACK_SYSTEM.md](BETA_FEEDBACK_SYSTEM.md) §3).
  - required field: short summary.
- [ ] Set `NEXT_PUBLIC_BETA_WAITLIST_URL` in `.env.local`.
- [ ] Set `NEXT_PUBLIC_BETA_FEEDBACK_URL` in `.env.local`.
- [ ] Set `NEXT_PUBLIC_FEATURE_BETA_INVITE=true` in `.env.local`.
- [ ] Restart `npm run dev`; confirm the homepage shows the invite card with the live URL.
- [ ] Confirm: with `NEXT_PUBLIC_BETA_WAITLIST_URL` blank, the CTA shows the disabled "tezliklə aktiv olacaq" state. With it set, it opens the form in a new tab.
- [ ] Create the operator spreadsheet (two tabs: invites, feedback — schemas in [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md) §6 and [BETA_FEEDBACK_SYSTEM.md](BETA_FEEDBACK_SYSTEM.md) §6).
- [ ] Re-read [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md) §8 (hard limits). Make sure nothing slipped in.
- [ ] Send wave 0 (team + 1st-degree network, ~7 people) and resolve any blockers before wave 1.

---

## 1. Before sharing the link with any new user

For every prospective invitee:

- [ ] Is this person in one of the §2 cohorts of [FIRST_100_BETA_PLAN.md](FIRST_100_BETA_PLAN.md)?
- [ ] Is the channel correct for the current wave (no mixing channels in 48 h windows)?
- [ ] Has wave 0 completed without an unresolved S0/S1?
- [ ] Is the local demo / staging URL reachable from the user's location?
- [ ] Is `NEXT_PUBLIC_BETA_WAITLIST_URL` live and the form accepting submissions?
- [ ] Did I personalize the first sentence of the invite copy ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §3)?
- [ ] Did I log the invite in the spreadsheet with `invited_at` and `source`?

If any answer is "no", do not send.

---

## 2. After each user submits the waitlist

- [ ] Triage within 24 h (target: same day).
- [ ] Mark `waitlist_submitted_at` in the spreadsheet.
- [ ] Decide: approve / hold / decline (write the reason in `notes`).
- [ ] If approved: send the welcome message ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §5).
- [ ] Mark `approved_at`.
- [ ] Set status → `approved`.

If declining: send no message. Leave the row in the spreadsheet for the record. Do not blacklist; people can be re-considered in later waves.

---

## 3. After every 10 active users

A 15-min review with the founder.

- [ ] Read the last 10 feedback entries.
- [ ] Categorize themes (search? data? dealer? trust?).
- [ ] Identify the top 1–2 issues.
- [ ] Decide: continue, slow down, or pause.
- [ ] Update the invite-tracker spreadsheet `status` column for inactive users.
- [ ] Confirm no S0/S1 bug is unresolved > 24 h.
- [ ] Confirm no dealer complaint is unresolved > 48 h.

---

## 4. Daily review

Once per working day, ideally 09:00 local.

- [ ] Pull all new waitlist submissions; triage.
- [ ] Pull all new feedback submissions; triage into spreadsheet per [BETA_FEEDBACK_SYSTEM.md](BETA_FEEDBACK_SYSTEM.md) §6.
- [ ] Send any pending welcome messages.
- [ ] Reply to any S0/S1 bug report within 4 h.
- [ ] Check the spreadsheet for users approved > 72 h ago with `feedback_received_at` still blank — send the nudge ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §6).
- [ ] Log the day's metrics: invites sent today, submissions received today, feedback received today, S0 count.
- [ ] Verify `NEXT_PUBLIC_BETA_WAITLIST_URL` still resolves (open it in an incognito tab).

---

## 5. Critical bug handling

If a user reports — or you discover — an S0:

- [ ] **Pause invites immediately.** Stop sending the next wave.
- [ ] Open the bug per [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md).
- [ ] If a wrong price or data integrity issue is involved, unpublish or correct the affected listing (admin) within 1 h.
- [ ] Send the pause message ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §8) to **active users only** — do not message dropped or inactive users.
- [ ] Within 24 h: fix forward OR roll back to the previous `demo-freeze` tag.
- [ ] After fix: post-mortem in [SPRINT_10_READINESS_REPORT.md](SPRINT_10_READINESS_REPORT.md). One paragraph minimum.
- [ ] Resume invites only after founder sign-off.

If the fix requires changes the brief disallows (real VIN provider, marketplace, payment, public route, Prisma migration, Vercel/Supabase) — **stop and re-scope with the founder**. Do not push through.

---

## 6. When to pause beta

Pause invites if **any** of the following is true:

- 1+ unresolved S0 for > 24 h.
- 2+ unresolved S1 from the same surface (search, listing, lead form).
- waitlist URL down for > 30 min during business hours.
- dealer-side complaint about lead quality unresolved > 48 h.
- waitlist conversion < 30 % across two consecutive waves.
- founder request, for any reason.

Pause = stop sending new invites. Existing approved users can keep using the product unless an S0 forces a takedown.

---

## 7. Communication templates by situation

Source for all of these is [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md). Do not improvise off-template messages in the operator role.

| Situation | Use |
|---|---|
| Direct invite to a person | §3 WhatsApp/Telegram 1:1 |
| Dealer relay request | §4 dealer invite |
| Waitlist approved | §5 welcome |
| 72 h after welcome, no feedback | §6 nudge |
| Critical pause | §8 pause |
| Removal request | §9 opt-out |
| Public mention before wave 3 | "Beta-dadır, daha geniş paylaşmaq üçün bir az gözləyirik." — no link |

---

## 8. What to send to dealers

Dealers are not a target *cohort* for the consumer beta, but they are a channel:

- [ ] Use the dealer invite copy ([FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §4) — not the consumer invite.
- [ ] Make sure the dealer has completed [DEALER_BETA_ONBOARDING.md](DEALER_BETA_ONBOARDING.md) before asking them to refer customers.
- [ ] When a dealer refers a customer, fill `source = "dealer:<dealer_name>"` in the spreadsheet.
- [ ] Share dealer-relevant feedback (lead quality, listing accuracy) with the originating dealer within 48 h. Do not share other users' feedback.

---

## 9. What to send to users (recap by stage)

| Stage | Message |
|---|---|
| Pre-invite | None — DM only after personal context. |
| Invite | [FIRST_100_BETA_COPY.md](FIRST_100_BETA_COPY.md) §3 |
| Post-waitlist approval | §5 welcome |
| 72 h post-welcome | §6 nudge |
| User reports S0/S1 | acknowledge in 4 h, fix ETA in 24 h |
| Beta pause | §8 |
| User opts out | §9 |
| Phase exit (after First 100 closes) | new copy, drafted in Sprint 10K |

---

## 10. Founder sign-off checklist (before first external invite)

- [ ] All four sprint-10J docs exist and are current.
- [ ] Beta invite CTA renders correctly with flag on + URL set.
- [ ] Beta invite CTA hides cleanly with flag off.
- [ ] Disabled CTA state works when URL is empty.
- [ ] All build gates passed in the last commit (`npx prisma validate`, `npm run lint`, `npx tsc --noEmit`, `npm run build`).
- [ ] No secrets, no `.env`, no real personal data committed.
- [ ] `demo-freeze-2026-05-18-v2` tag exists on `origin`.
- [ ] Founder has read this checklist and the plan end-to-end.
- [ ] Wave 0 executed; no S0 outstanding.

Only then: send wave 1.
