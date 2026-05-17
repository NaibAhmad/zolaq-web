# Session Cookie Security — Sprint 9E

## Cookie flags (all three sessions)

| Flag | Value | Why |
|---|---|---|
| `httpOnly` | `true` | Blocks JS read — defends against XSS exfil. |
| `sameSite` | `"lax"` | Allows top-level navigation, blocks third-party POSTs. We chose `lax` over `strict` so a customer arriving from a Google search to a deep `/profile/*` link keeps their session. |
| `secure` | `process.env.NODE_ENV === "production"` | HTTPS-only in prod; dev allows HTTP. |
| `path` | `"/"` | All paths can read/write the cookie. Splitting paths per panel would require cross-path checks that don't pay for themselves yet. |
| `maxAge` | 604_800 (7 days) | Same value across cookies (`SESSION_MAX_AGE_SECONDS` in [lib/auth/constants.ts](../../lib/auth/constants.ts)). |
| signature | HMAC-SHA256 over base64url(payload) | See below. |

Same flag set is set on logout (`maxAge: 0` to immediately delete).

## Signed cookie format

[lib/auth/cookie-sign.ts](../../lib/auth/cookie-sign.ts) defines:

```
cookieValue = base64url(JSON.stringify(payload)) + "." + base64url(HMAC_SHA256(secret, base64url(payload)))
```

On decode:
1. Split on the first `.`.
2. Recompute HMAC over the payload chunk.
3. `timingSafeEqual` against the provided signature; mismatch → null.
4. base64url-decode the payload → JSON.parse → shape check.

A user editing the cookie to flip `role` to `super_admin` fails step 3, so the helper returns null and the layout/API guard treats it as "no session".

## Secret management

- **Production**: `AUTH_SESSION_SECRET` must be set. Generate with `openssl rand -base64 48`. Throws on first sign/verify if missing (no silent fallback).
- **Dev / CI**: a fixed dev fallback is used; a one-time `console.warn` is printed so it's obvious in logs.

## Cutover from unsigned cookies

When `DEV_AUTH_MODE=true`, the decode path falls back to the legacy `base64(JSON)` format if signature verification fails. This is a one-cycle compatibility shim so devs aren't logged out the moment the signing change lands. Production has no fallback — old cookies issued before 9E are rejected and the user is sent to login.

## Threat model coverage

| Threat | Mitigation |
|---|---|
| XSS reads the cookie | `httpOnly: true` |
| CSRF via third-party site | `sameSite: lax` + state-changing routes require non-GET methods + session check |
| Attacker edits cookie to escalate role | HMAC signature fails decode |
| Session theft via network sniff | `secure: true` in prod (HTTPS only) |
| Stale session after logout | `clearXxxSession()` writes `maxAge: 0` cookie |
| Session lives forever | 7-day `maxAge` + payload `exp` check on decode |
| Single secret compromise | Rotate `AUTH_SESSION_SECRET` (forces re-login for everyone) |

## Open items (9F)

- DB-backed session table (`AdminSession.revoked_at`) so individual sessions can be killed without rotating the secret.
- Session refresh / sliding expiry (currently sessions are fixed 7-day windows from issue time).
- `__Host-` cookie name prefix once we're confident path scoping won't be needed.
