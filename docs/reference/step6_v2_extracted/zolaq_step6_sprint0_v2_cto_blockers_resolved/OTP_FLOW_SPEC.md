# OTP_FLOW_SPEC.md

## Decision

OTP must be adapter-based.

- Sprint 1 can start with mock OTP provider.
- Production/staging requires real SMS provider before public testing.

## Final OTP rules

| Rule | Value |
|---|---|
| OTP length | 6 digits |
| Expiry | 5 minutes |
| Resend cooldown | 60 seconds |
| Max attempts | 3 |
| Rate limit | 3 OTP/hour per phone |
| phone_hash | SHA-256 + per-environment salt |
| raw phone | encrypted at rest |
| unverified draft lead expiry | 24 hours |
| OTP purpose | lead_submit / whatsapp_handoff / profile_access |

## Required states

- request sent
- resend cooldown active
- wrong code
- max attempts reached
- expired code
- verified
- unverified draft expired

## Privacy

- Analytics never receives raw phone.
- Dealer never receives phone unless user explicitly consents in a later flow.
- Internal systems use phone_hash and encrypted raw phone only.
