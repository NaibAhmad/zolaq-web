# Sprint 10 — SMS Provider Readiness

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Closed-beta posture:** `SMS_PROVIDER=mock`. Real provider selection is **required before public launch** but not before closed beta.

## Why this is staged

Customer OTP flow is the only place Zolaq sends SMS today. During closed beta we accept the limitation that OTP codes appear only in Vercel server logs (mock provider) because:

- Beta testers are recruited and shepherded by the operator — they can be given the code out-of-band if needed.
- Real SMS costs money per send; we don't pay until the flow is proven.
- Real SMS requires sender ID registration in Azerbaijan, which has a lead time of days-to-weeks. Starting the procurement and registration now in parallel with beta keeps the public-launch window short.

## 1. Current abstraction (already implemented in Sprint 9F)

The SMS provider lives at [lib/sms/](../../lib/sms/) with three implementations:

| File | Provider | Behavior |
|---|---|---|
| [lib/sms/provider.ts](../../lib/sms/provider.ts) | `SmsProvider` interface | Defines `sendOtp(phone, code, locale): Promise<SmsSendResult>`. |
| [lib/sms/mock-provider.ts](../../lib/sms/mock-provider.ts) | `mock` | Logs `[MOCK-OTP] phone=… code=…` to server console. Production refuses to load mock unless `DEV_AUTH_MODE=true` is also set (safety interlock). |
| [lib/sms/http-provider.ts](../../lib/sms/http-provider.ts) | `http` | Generic POST to `SMS_API_URL` with bearer auth from `SMS_API_KEY`, `from` = `SMS_SENDER_ID`, timeout `SMS_TIMEOUT_MS`. Returns provider-agnostic result shape. |
| [lib/sms/index.ts](../../lib/sms/index.ts) | `disabled` (built-in) | Returns `AUTH_NOT_AVAILABLE` for every call. Default in production when `SMS_PROVIDER` is unset. |

Selection happens via `SMS_PROVIDER`. The OTP endpoints ([app/api/auth/otp/request/route.ts](../../app/api/auth/otp/request/route.ts), [app/api/auth/otp/verify/route.ts](../../app/api/auth/otp/verify/route.ts)) consume the provider through the abstraction — **no provider name is hardcoded in route code.**

## 2. Required env var contract

| Variable | Required for | Purpose | Treat as |
|---|---|---|---|
| `SMS_PROVIDER` | Always | `mock` \| `http` \| `disabled` | Config |
| `SMS_API_URL` | `http` only | Provider endpoint (e.g., `https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json`) | Config |
| `SMS_API_KEY` | `http` only | Bearer/auth token | **Secret** — never log |
| `SMS_SENDER_ID` | `http` only | Sender ID / "from" number | Config (but often registered/regulated) |
| `SMS_TIMEOUT_MS` | `http` only | Per-send timeout in ms (default 5000) | Config |

The HTTP provider speaks a generic shape; provider-specific shims (e.g., Twilio's form-encoded request body) will need a thin adapter at the [http-provider.ts](../../lib/sms/http-provider.ts) layer when a real provider is selected.

## 3. Provider candidates

Recommendations split into Azerbaijan-local and global. The deliverability column reflects Azerbaijan-bound traffic specifically.

### 3.1 Azerbaijan-local (recommended for production)

| Provider | URL | Notes | AZ deliverability | Pricing (indicative) | Sender ID |
|---|---|---|---|---|---|
| **Lider Mobile** | lidermobile.az | Long-running AZ A2P operator | Excellent | Mid | Alphanumeric supported |
| **BizimSMS** | bizimsms.az | AZ-focused SMS gateway | Excellent | Low-mid | Alphanumeric supported |
| **Smartmessage** | smartmessage.az | AZ A2P + bulk | Good | Mid | Alphanumeric supported |

**Why local:** lower per-message cost, faster delivery for AZ-bound numbers, simpler regulatory/sender-ID registration, AZ-language support staff.

### 3.2 Global (fallback / dual-provider option)

| Provider | URL | Notes | AZ deliverability | Pricing (indicative) | Sender ID |
|---|---|---|---|---|---|
| Twilio | twilio.com | Global A2P, programmable SMS API | Good (via international routes) | High | Alphanumeric in some routes; long code elsewhere |
| MessageBird (Bird) | messagebird.com | Global A2P, EU-based | Good | Mid-high | Alphanumeric supported |
| Vonage | vonage.com | Global A2P, ex-Nexmo | Acceptable | Mid-high | Alphanumeric supported |

**Why consider global:** developer-friendly APIs, well-documented SDKs, useful as a redundancy provider if the AZ-local primary has an outage.

### 3.3 Selection criteria (to apply at provider-selection time)

1. AZ-bound delivery rate (≥ 98%).
2. Alphanumeric sender ID support for `ZOLAQ`.
3. Latency to delivery (target P95 < 30s).
4. Per-message price (AZN or USD).
5. Sandbox / test mode availability.
6. Support response SLA in AZ business hours.
7. PCI/data-handling stance on phone numbers (we send hashed numbers internally; the provider gets raw to deliver).

Score each candidate, pick a primary, evaluate a secondary as a hot-swap fallback.

## 4. Sandbox / test mode

During provider evaluation:

- Use the provider's sandbox account (Twilio Trial, MessageBird Test, etc.) before paying.
- Restrict the sandbox to a small allowlist of internal test phone numbers.
- Set `SMS_PROVIDER=http`, `SMS_API_URL=<sandbox URL>`, `SMS_API_KEY=<sandbox key>` in a Vercel **Preview** environment (not the staging Production scope), so a one-off branch deploy can exercise the real HTTP path without impacting `staging.zolaq.az`.

## 5. Failure behavior

The HTTP provider must (and currently does — see [http-provider.ts](../../lib/sms/http-provider.ts)) handle these cases gracefully:

| Failure | Behavior | User-visible |
|---|---|---|
| Network timeout | Returns `AUTH_NOT_AVAILABLE`, OTP not issued. | "Could not send code. Try again." |
| Auth error (401/403) | Returns `AUTH_NOT_AVAILABLE`, error logged with provider name (no key in the log). | Same. |
| Provider 5xx | Returns `AUTH_NOT_AVAILABLE`. | Same. |
| Rate-limit (429) from provider | Returns `AUTH_NOT_AVAILABLE`. Respect provider's retry-after if present. | Same. |
| Invalid phone format | Caught earlier by [lib/auth/phone.ts](../../lib/auth/phone.ts); never reaches provider. | "Invalid phone number." |

The OTP route never reveals which downstream failure occurred — uniformly `AUTH_NOT_AVAILABLE`.

## 6. No raw phone leaks

Verify these properties before any provider goes live (also enforced in [SECURITY_PRIVACY_BETA_CHECKLIST.md](./SECURITY_PRIVACY_BETA_CHECKLIST.md) §raw-phone):

- ✅ Phone numbers are hashed via [lib/auth/phone.ts](../../lib/auth/phone.ts) `phoneHash()` before being stored in `OtpAttempt` or `AuditLog`.
- ✅ Server logs **must not** contain raw phone numbers. The mock provider logs the raw number by design (dev only); ensure mock is never enabled in production.
- ✅ The HTTP provider sends raw phone to the SMS provider (it has to in order to deliver), but does not log it.
- ✅ Error responses to the client carry no phone-derived identifier.

## 7. Public-launch checklist (NOT for closed beta)

These items are explicitly **deferred past Sprint 10**:

- [ ] Pick AZ-local primary + global secondary.
- [ ] Register `ZOLAQ` sender ID with the chosen provider(s).
- [ ] Sign vendor contract / set up billing.
- [ ] Move sandbox config from Vercel Preview to Production.
- [ ] Add provider-specific request adapter to [http-provider.ts](../../lib/sms/http-provider.ts) if needed.
- [ ] Add dual-provider failover logic (Sprint 11+).
- [ ] Add per-day spend cap monitoring.

## Cross-references

- OTP test scenarios: [OTP_STAGING_TEST_PLAN.md](./OTP_STAGING_TEST_PLAN.md)
- Sprint 9F SMS provider setup notes: [docs/sprint-9f/SMS_PROVIDER_SETUP.md](../sprint-9f/SMS_PROVIDER_SETUP.md)
- Sprint 9E customer OTP security review: [docs/sprint-9e/CUSTOMER_OTP_SECURITY_REVIEW.md](../sprint-9e/CUSTOMER_OTP_SECURITY_REVIEW.md)
- Privacy checklist: [SECURITY_PRIVACY_BETA_CHECKLIST.md](./SECURITY_PRIVACY_BETA_CHECKLIST.md)
