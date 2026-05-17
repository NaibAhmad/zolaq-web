# Sprint 10 — Dealer Beta Onboarding

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Target cohort:** 5–10 beta dealers (existing AZ network).
**Outcome:** each onboarded dealer has a verified profile, can log in, can upload media, can publish offers, and knows the SLA + support channel.

## 0. Pre-onboarding (operator side)

- [ ] Dealer recruited (warm intro, not cold outreach).
- [ ] Dealer agreed to NDA-equivalent beta participation terms.
- [ ] Dealer received a one-pager explaining the beta scope, what's working, what's not (no online payment, no marketplace, no WhatsApp Business yet).
- [ ] Operator has confirmed dealer's legal name, contact phone, contact email, physical location.

## 1. Account creation (operator side)

Performed in the admin console:

1. Sign in as admin at `https://staging.zolaq.az/admin/login`.
2. Navigate to **Dealers** → **New dealer**.
3. Enter:
   - Legal name
   - Display name (consumer-facing)
   - Primary contact email
   - Primary phone
   - Physical address
   - License/registration number (internal)
4. Submit. The system creates the `Dealer` row and queues a `DealerUser` invite.
5. Generate a temporary password (`openssl rand -base64 12` — written down once, handed off securely; never emailed in plaintext during beta).
6. Create the `DealerUser` row with role `dealer_owner` (or `dealer_manager` for sub-accounts).
7. Hand off credentials to the dealer via a secure channel (in-person, sealed envelope, or password-manager share).

## 2. Dealer first login

Dealer-side steps:

1. Visit `https://staging.zolaq.az/dealer/login`.
2. Enter email + temporary password.
3. **Force a password reset** on first login (dealer changes the password to one they choose).
4. Land on the dealer console home.

## 3. Profile setup (dealer side)

Dealer fills in:

- [ ] Display name (consumer-facing).
- [ ] Tagline / short description.
- [ ] Long description (markdown-supported).
- [ ] Operating hours per day.
- [ ] Service list (sales, service, parts, leasing, etc.).
- [ ] Supported brands.
- [ ] Geographic service area.
- [ ] Map pin (lat/lng) — operator verifies before publish.
- [ ] At least one storefront photo + one team photo (via media upload — see §4).

Profile status is **draft** until operator approves it (see [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md) §dealer-approval).

## 4. Media upload (dealer side)

Dealer uploads media via the dealer console:

- Accepted formats: JPEG, PNG, WebP.
- SVG: rejected (security).
- Max size: 8 MB per file (configurable via `MEDIA_UPLOAD_MAX_MB`).
- Magic-byte validation enforced by [lib/media/validation.ts](../../lib/media/validation.ts).
- Dealer uploads land in the **approval queue** — they are NOT auto-published.
- Operator approves or rejects each asset; rejection includes a reason.

## 5. Offer creation (dealer side)

Once profile is approved, dealer can create offers:

- [ ] Pick a specific `Trim` (the form requires it — no model-only offers).
- [ ] Enter offered price in AZN.
- [ ] Add at least one media asset.
- [ ] Specify contact channels (phone / form / WhatsApp number).
- [ ] Optional: warranty, leasing terms, delivery options.
- [ ] Save as **draft** or submit for **review**.

Offers go to the approval queue. Operator review per [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md) §offer-review.

## 6. Payment proof flow (if applicable)

Closed beta does NOT charge dealers, so the payment-proof flow is **not exercised in Sprint 10**. The UI exists (Sprint 7j scope) but is feature-flagged off for beta dealers. Operators should confirm the flag is off before each onboarding.

## 7. Ad request flow (if applicable)

Same posture as payment proof — feature-flagged off for closed beta. Dealers can browse the ad slot inventory but cannot purchase. Document any dealer feedback about ad pricing for use in the post-beta product review.

## 8. Response SLA expectations

Communicated to each dealer in writing during onboarding:

| Event | Operator response SLA |
|---|---|
| Profile change requested | 1 business day |
| Media approval | 1 business day |
| New offer review | 1 business day |
| Critical bug report | 4 business hours |
| Non-critical bug report | 2 business days |
| Feature request / feedback | Acknowledged within 1 business day; logged in the feedback tracker |

Dealers commit (best-effort) to:

| Event | Dealer response SLA |
|---|---|
| Inbound lead from a beta user | 24 hours during beta |
| Operator question | 1 business day |
| Asked to test a fix | 2 business days |

## 9. Support channel

- **Primary:** dedicated Telegram/WhatsApp group with operators + all beta dealers.
- **Secondary:** dealer-support@<staging-org-email>.
- **Out of scope:** phone support hotline (deferred past beta).

## 10. Beta feedback form

Each dealer receives a link to the dealer-side feedback form:

- Bug reports
- Friction points
- Feature requests
- Pricing/business-model feedback

See [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md) for the question template; dealer form is a variant with extra business-side questions.

## 11. Sign-off

Operator confirms (via [DEALER_BETA_QA_CHECKLIST.md](./DEALER_BETA_QA_CHECKLIST.md)):
- Dealer can log in.
- Profile published.
- ≥ 2 offers approved.
- Dealer added to support channel.
- Dealer received SLA expectations + feedback form link.

```
Dealer: <name>
Onboarded: 2026-MM-DD
Operator: <initials>
Status: COMPLETE
```

## Cross-references

- Dealer QA checklist: [DEALER_BETA_QA_CHECKLIST.md](./DEALER_BETA_QA_CHECKLIST.md)
- Admin SOP for approvals: [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md)
- Dealer permissions: [docs/sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md](../sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md)
- Dealer auth: [docs/sprint-9f/DEALER_PASSWORD_AUTH.md](../sprint-9f/DEALER_PASSWORD_AUTH.md)
- Media rules: [docs/sprint-9d/MEDIA_SECURITY_RULES.md](../sprint-9d/MEDIA_SECURITY_RULES.md)
- Feedback form: [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md)
