# Sprint 10 — Closed Beta User Test Plan

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Cohort:** 20–50 closed-beta testers (invitation only).
**Environment:** `https://staging.zolaq.az` (mock SMS provider).

## Goal

Get real users through the 14 most important flows and capture friction, bugs, and feedback. The point is not coverage — it's catching the things our internal QA cannot see.

## Cohort selection

| Segment | Target count | Recruited by |
|---|---|---|
| Power users / car enthusiasts | 8–15 | Operator outreach |
| First-time car buyers | 5–10 | Operator outreach |
| Industry contacts (mechanics, dealers' staff) | 3–8 | Operator outreach |
| AZ / RU / EN preference distribution | 60% AZ / 25% RU / 15% EN (approximate) | Recruit accordingly |
| Mobile-primary users (390px–414px) | ≥ 60% | Recruit accordingly |
| Light-theme + dark-theme distribution | At least 30% each | Self-selected |

## What testers receive

- Invitation link to `https://staging.zolaq.az`.
- A test scenario sheet (this document, condensed to a 1-pager handout).
- A link to [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md) (the form itself, hosted in Google Forms / Tally).
- A note that the environment is beta, mock-SMS, data is staging-only, and uploaded media may be wiped.
- A note on data privacy: phone numbers are hashed, no SMS is actually sent, no real data is stored beyond the staging DB.

## Beta period

- **Duration:** 2–3 weeks per cohort wave.
- **Wave 1:** 5–10 testers (small smoke). Run for 1 week.
- **Wave 2:** 15–40 testers. Run for 2 weeks.
- Operator triages feedback daily.

## 14 test flows

For each, capture: did it work, how long did it take, where did the user get stuck, screenshot of any error.

### 1. Homepage search
- Open `/`.
- Use the homepage search field to look for a known brand (e.g., "BYD").
- Expect: results page with filtered cars.

### 2. `/cars` quick search
- Open `/cars`.
- Apply 2 filters (brand + body type, or brand + price range).
- Expect: result set narrows; URL reflects filter state; back/forward navigation preserves state.

### 3. Nəsil (Generation) filter
- On `/cars`, filter by a specific generation of a chosen model.
- Expect: only trims of that generation appear.

### 4. Komplektasiya (Trim) filter
- On `/cars`, drill from generation into a specific trim.
- Expect: trim-level results; clear way to back out.

### 5. Car detail
- Open any car detail page `/cars/<carId>`.
- Verify: title, hero image, key specs, price, dealer offers, related trims.
- Mobile 390px: no horizontal scroll; key info is above the fold or one scroll down.

### 6. Compare
- Add 2 cars to compare via the "Compare" toggle.
- Open `/compare`.
- Expect: side-by-side spec comparison; remove-from-compare works.

### 7. Lead request
- On a car detail or dealer offer, click the lead/inquiry CTA.
- Fill the form.
- Submit.
- Expect: confirmation screen; lead lands in the dealer's pending leads in admin/dealer console.

### 8. OTP
- Open `/auth/otp` (or wherever phone-based sign-in starts).
- Enter test phone.
- Submit.
- Get the code from the operator (mock provider — code in Vercel logs).
- Enter the code.
- Expect: lands on `/profile`.

### 9. Profile
- Sign in via OTP.
- Visit `/profile`.
- Edit name (or whichever profile fields are editable).
- Save.
- Reload — changes persist.

### 10. Saved / Viewed cars
- While signed in, tap "Save" on 2 cars.
- Visit `/profile/saved` — both appear.
- Visit `/profile/viewed` — recently viewed cars appear.
- Unsave one — disappears from `/profile/saved`.

### 11. Dealer profile
- Open `/dealers/<slug>` for any approved dealer.
- Verify: profile, services, contact buttons, offer list.
- Tap a contact button — opens the appropriate channel (phone / form / WhatsApp).

### 12. Q&A / Bazar Nəbzi
- Open `/qa` — browse 2–3 entries.
- Open `/encyclopedia` (and a Bazar Nəbzi entry).
- Optional: submit a question via the Q&A form.
- Expect: content renders; markdown formatted correctly; no broken images.

### 13. Mobile 390px
- All of the above on a 390px-wide viewport.
- Capture: any horizontal scroll, overlapping text, off-screen CTAs.

### 14. Light/Dark theme
- Toggle theme on the homepage.
- Walk 3 representative pages (`/`, `/cars`, a car detail) in each mode.
- Capture: contrast issues, theme flicker on navigation, missing dark-mode styles.

## Tester instructions (handout-ready)

```
1. Open https://staging.zolaq.az on your phone.
2. Browse the site as if shopping for a car.
3. Try at least:
   - homepage search
   - filtering /cars
   - opening a car detail
   - comparing 2 cars
   - sending a lead
   - signing in via phone (the code comes from us, not SMS)
4. Report anything weird at <feedback form link>.
5. If something breaks, screenshot it. Note your phone model and OS.
```

## Operator-side instrumentation

- Vercel analytics: enabled (privacy-friendly mode).
- Custom events: lead submission, OTP request, OTP success, OTP failure, theme toggle, locale toggle.
- Audit log: every admin / dealer action.
- No third-party tracking SDKs during beta.

## Exit criteria for closed beta

- [ ] ≥ 20 testers completed at least the first 5 flows.
- [ ] All P0 bugs resolved.
- [ ] All P1 bugs resolved or have a documented workaround.
- [ ] Net positive qualitative feedback on the core flow (search → detail → lead).
- [ ] No security-privacy regression vs Sprint 9 closure baseline.

## Cross-references

- Feedback form template: [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md)
- Bug triage: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)
- Security checklist: [SECURITY_PRIVACY_BETA_CHECKLIST.md](./SECURITY_PRIVACY_BETA_CHECKLIST.md)
- Performance/SEO: [PERFORMANCE_SEO_BETA_CHECKLIST.md](./PERFORMANCE_SEO_BETA_CHECKLIST.md)
- OTP test scenarios (internal): [OTP_STAGING_TEST_PLAN.md](./OTP_STAGING_TEST_PLAN.md)
