# Sprint 10 — Dealer Beta QA Checklist

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** Per-dealer sign-off after onboarding ([DEALER_BETA_ONBOARDING.md](./DEALER_BETA_ONBOARDING.md)) and repeated weekly during beta.

## Dealer info

```
Dealer: ______________________________
Operator running check: __________
Date: 2026-__-__
Check type: [ ] Initial onboarding   [ ] Weekly beta check
```

## A. Authentication

- [ ] Dealer can sign in at `/dealer/login` with their chosen (post-reset) password.
- [ ] Dealer cannot sign in to `/admin/login` (separate session, different cookie, different role).
- [ ] Session cookie `zlq_dealer_session` is httpOnly, secure, sameSite=lax.
- [ ] Sign-out clears the cookie; protected dealer pages then 302 to `/dealer/login`.
- [ ] Tampered dealer cookie produces a re-auth, not an error 500.

## B. Profile

- [ ] Dealer profile is published and visible at `/dealers/<slug>`.
- [ ] Display name, tagline, description, hours, services, brands, location all rendered.
- [ ] Profile page renders correctly at mobile 390px.
- [ ] Profile page renders correctly in light AND dark theme.

## C. Media

- [ ] Dealer has uploaded ≥ 1 storefront/team photo.
- [ ] All uploaded media is approved by an operator.
- [ ] No SVG was accepted (test by attempting to upload one — must reject).
- [ ] A file > 8 MB is rejected.
- [ ] No watermarks from competing services visible.

## D. Offers

- [ ] Dealer has ≥ 2 approved offers in the catalog.
- [ ] Each offer references a real `trim_id`.
- [ ] Each offer has price + currency + at least one media asset.
- [ ] Each offer is reachable at `/dealers/<slug>` and from the trim's detail page.
- [ ] Offer card displays correctly at mobile 390px.

## E. Permissions

- [ ] Dealer A cannot view or modify Dealer B's offers via direct URL.
- [ ] Dealer A cannot view Dealer B's media assets via direct URL.
- [ ] Dealer A cannot impersonate Dealer B via cookie swap (tested by operator).
- [ ] Dealer cannot reach any `/admin/*` route.
- [ ] Specific dealer permissions covered: see [docs/sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md](../sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md).

## F. Public visibility

- [ ] Dealer profile shows in `/dealers` listing.
- [ ] Trust badges (verification, response time) render where applicable.
- [ ] No PII leak (license number, internal notes) on public surfaces.

## G. Support & feedback

- [ ] Dealer is in the support Telegram/WhatsApp group.
- [ ] Dealer received SLA expectations document.
- [ ] Dealer received feedback form link.
- [ ] Dealer submitted at least one feedback form entry (encouraged, not blocking).

## H. Weekly health (skip on initial onboarding)

- [ ] No dealer-reported bugs unresolved past their SLA.
- [ ] No dropped offer approvals.
- [ ] No media moderation queue items > 1 business day old for this dealer.
- [ ] No spike in failed login attempts.

## Sign-off

```
Verdict: [ ] PASS   [ ] PASS with issues   [ ] FAIL
Notes: _____________________________________________
Action items: _____________________________________
Operator initials + date: __________
```

## Failure handling

If any item fails:
- File a bug per [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md).
- For permission violations (Section E), treat as **P0** — direct dealer-to-dealer data leakage is unacceptable.
- For auth failures (Section A), treat as **P0**.

## Cross-references

- Onboarding flow: [DEALER_BETA_ONBOARDING.md](./DEALER_BETA_ONBOARDING.md)
- Permission matrix: [docs/sprint-9e/RBAC_PERMISSION_MATRIX.md](../sprint-9e/RBAC_PERMISSION_MATRIX.md)
- Dealer permission enforcement: [docs/sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md](../sprint-9f/DEALER_PERMISSION_ENFORCEMENT.md)
- Session cookie security: [docs/sprint-9e/SESSION_COOKIE_SECURITY.md](../sprint-9e/SESSION_COOKIE_SECURITY.md)
- Bug triage: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)
