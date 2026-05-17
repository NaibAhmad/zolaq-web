# Sprint 10 — Closed Beta Feedback Form

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Form hosting:** Google Forms or Tally. This file defines the question template; create the actual form using one of those tools and link the URL into the tester invitation.

## Form purpose

Capture structured feedback from beta testers (and a parallel variant for beta dealers) so triage in [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md) is fast.

## Privacy note (top of form)

```
Your feedback helps us build Zolaq. We collect only:
- Your answers below.
- Your tester ID (if you have one).
We do NOT collect: your phone number, your IP, your name (unless you choose to share).
The closed beta runs on a staging environment. No real SMS is sent. Any data
you enter or upload may be cleared at the end of beta.
```

## Section 1 — About this report

| # | Question | Type | Required |
|---|---|---|---|
| 1 | What kind of feedback is this? | Single choice: Bug / Feature request / Friction point / Compliment / Other | ✅ |
| 2 | One-line summary | Short text | ✅ |
| 3 | Severity (your guess) | Single choice: Blocking me / Annoying but I worked around it / Minor / Nice to have | ✅ |

## Section 2 — Where it happened

| # | Question | Type | Required |
|---|---|---|---|
| 4 | Which page/flow? | Single choice: Homepage / `/cars` search / Car detail / Compare / Lead form / Phone sign-in / Profile / Saved & viewed / Dealer profile / Q&A or Encyclopedia / Bazar Nəbzi / Mobile layout / Theme toggle / Other | ✅ |
| 5 | URL (if you can grab it) | Short text | ⬜ |
| 6 | Approximate time | Short text or auto-timestamp | ⬜ |

## Section 3 — What happened

| # | Question | Type | Required |
|---|---|---|---|
| 7 | What were you trying to do? | Long text | ✅ |
| 8 | What did you expect to happen? | Long text | ✅ |
| 9 | What actually happened? | Long text | ✅ |
| 10 | Can you reproduce it? | Single choice: Always / Sometimes / Once / Don't know | ✅ |
| 11 | Steps to reproduce (if you can list them) | Long text | ⬜ |

## Section 4 — Attachments

| # | Question | Type | Required |
|---|---|---|---|
| 12 | Upload a screenshot / screen recording | File upload (≤ 10 MB) | ⬜ |
| 13 | Any error message you saw | Long text | ⬜ |

## Section 5 — Environment

| # | Question | Type | Required |
|---|---|---|---|
| 14 | Device | Single choice: Phone / Tablet / Desktop laptop / Other | ✅ |
| 15 | Phone model + OS version (if mobile) | Short text | ⬜ |
| 16 | Browser + version | Short text | ⬜ |
| 17 | Theme during issue | Single choice: Light / Dark / Auto / I switched mid-test | ⬜ |
| 18 | Language during issue | Single choice: AZ / RU / EN | ⬜ |

## Section 6 — About you (optional)

| # | Question | Type | Required |
|---|---|---|---|
| 19 | Tester ID (from your invite) | Short text | ⬜ |
| 20 | Can we follow up with you? | Single choice: Yes — same channel / Yes — email me / No, this is anonymous | ⬜ |
| 21 | Email or contact handle if "yes" | Short text | ⬜ |

## Section 7 — Sentiment

| # | Question | Type | Required |
|---|---|---|---|
| 22 | Overall, how was your experience with Zolaq today? | 1–5 stars | ✅ |
| 23 | Anything you loved? | Long text | ⬜ |
| 24 | Anything you'd change first? | Long text | ⬜ |

---

## Dealer variant — additional questions

For the dealer feedback form, append these:

| # | Question | Type | Required |
|---|---|---|---|
| D1 | Which dealer are you reporting for? | Short text or dropdown of beta dealers | ✅ |
| D2 | Which dealer-side flow? | Single choice: Login / Profile setup / Media upload / Offer creation / Lead inbox / Other | ✅ |
| D3 | How long did the task take? | Single choice: < 1 min / 1–5 min / 5–15 min / > 15 min / I couldn't finish it | ⬜ |
| D4 | Pricing-model feedback (if you have any) | Long text | ⬜ |
| D5 | What would make you commit to Zolaq post-beta? | Long text | ⬜ |

---

## Operator triage flow

1. Submissions land in the form-hosting tool's response inbox.
2. Operator reviews daily (see [ADMIN_BETA_QA_CHECKLIST.md](./ADMIN_BETA_QA_CHECKLIST.md) §E).
3. Each entry is converted to a triage record per [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md).
4. Acknowledgement is sent if the submitter said "yes — follow up."

## Retention

Form responses are retained for the duration of the beta + 90 days, then exported to the project archive and the live form responses are deleted. This is documented at the top of the form so testers consent at submission time.

## Cross-references

- Test plan: [CLOSED_BETA_USER_TEST_PLAN.md](./CLOSED_BETA_USER_TEST_PLAN.md)
- Bug triage: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)
- Daily operator check: [ADMIN_BETA_QA_CHECKLIST.md](./ADMIN_BETA_QA_CHECKLIST.md)
