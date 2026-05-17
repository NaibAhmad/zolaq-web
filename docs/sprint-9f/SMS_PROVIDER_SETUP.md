# SMS provider setup (Sprint 9F)

## Layout

```
lib/sms/
  provider.ts        SmsProvider interface, SendOtpInput / SendOtpResult
  mock-provider.ts   Dev console logger; refuses to construct in production
  http-provider.ts   Generic HTTP POST adapter (Twilio-style / SMSc-style)
  index.ts           getSmsProvider() factory; reads SMS_PROVIDER env
```

The OTP request route calls `otpProvider.sendCode(...)` from
[`lib/auth/otp-provider.ts`](../../lib/auth/otp-provider.ts), which delegates
to `getSmsProvider().sendOtp(...)`. No route change is needed when swapping
vendors — only the env vars.

## Env vars

| Name             | Required           | Notes |
|------------------|--------------------|-------|
| `SMS_PROVIDER`   | optional           | `mock` / `http` / `disabled`. Default: `mock` in dev, `disabled` in production. |
| `SMS_API_URL`    | when `http`        | Vendor endpoint that accepts a single SMS send. |
| `SMS_API_KEY`    | when `http`        | Sent as `Authorization: Bearer <key>`. |
| `SMS_SENDER_ID`  | when `http`        | Originator string (vendor-specific; e.g. "Zolaq"). |
| `SMS_TIMEOUT_MS` | optional           | AbortController timeout. Default 5000. |

## Mode behavior

### `mock`
Logs `[MOCK-OTP] phoneHash=<prefix>… purpose=<...> code=<...>` to the server
console. The constructor throws if `NODE_ENV=production` and
`DEV_AUTH_MODE !== "true"`, so a misconfigured prod cannot silently fall back
here.

### `http`
Posts JSON to `SMS_API_URL`:

```http
POST $SMS_API_URL
Content-Type: application/json
Authorization: Bearer $SMS_API_KEY

{
  "sender": "$SMS_SENDER_ID",
  "phone":  "<E.164 normalized number>",
  "text":   "Zolaq tesdiq kodu: <code>"
}
```

Success is any 2xx response. On `4xx`/`5xx` the provider returns
`{ ok: false, reason: "http_<status>" }`; on network error or timeout,
`reason: "network_error" | "timeout"`. The OTP route maps any `!ok` to
`AUTH_NOT_AVAILABLE` (HTTP 503).

Adapting to a vendor that requires a different body shape is a thin wrapper
in `http-provider.ts` — keep this adapter neutral so the vendor swap is one
file.

### `disabled`
Returns `{ ok: false, reason: "disabled" }` immediately, no I/O. The OTP
route maps this to `AUTH_NOT_AVAILABLE`. Production default until a vendor
is wired.

## Production checklist

- [ ] `SMS_PROVIDER=http` set.
- [ ] `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID` set.
- [ ] `SMS_TIMEOUT_MS` matches the vendor's documented worst-case latency.
- [ ] `DEV_AUTH_MODE` unset or `false`.
- [ ] Server logs reviewed for absence of `[MOCK-OTP]` lines.
