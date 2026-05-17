# Staging Noindex Policy (Sprint 10B)

## Why

Closed beta runs on `staging.zolaq.az` (Vercel). Before testers are invited,
search engines must not index staging — beta data is incomplete, demo-flagged,
and not representative of public truth. Production launch must NOT inherit
this protection: the same codebase will eventually serve the production host
with permissive SEO.

## Implementation

Two complementary layers, both env- and hostname-aware:

### Layer 1 — Proxy header

[proxy.ts](../../proxy.ts) attaches `X-Robots-Tag: noindex, nofollow, noarchive`
to every non-static response when **either** of the following is true:

- `STAGING_NO_INDEX=true` is set on the Vercel environment, **or**
- the request `Host` header is `staging.zolaq.az`

> Next 16 note: this codebase uses the new `proxy.ts` convention (formerly
> `middleware.ts`). See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

### Layer 2 — robots.ts

[app/robots.ts](../../app/robots.ts) emits a deny-all `robots.txt` when
`STAGING_NO_INDEX=true`. Otherwise it emits a permissive policy that disallows
only authenticated/API areas (`/admin/`, `/dealer/`, `/api/`, `/profile/`,
`/auth/`).

`robots.ts` is marked `dynamic = "force-dynamic"` so its output reflects the
runtime env, not the build-time env.

## Required env on Vercel staging environment

Set on the **Vercel Staging** environment (NOT Production):

```
STAGING_NO_INDEX=true
```

Set on **Vercel Production**: leave unset (or `STAGING_NO_INDEX=false`). With
the env unset and the production host not equal to `staging.zolaq.az`, both
layers default to permissive — no manual cleanup needed at launch time.

## Acceptance tests

Run after deploy. All four must pass before inviting beta testers.

```bash
# 1. Staging response has the noindex header
curl -sI https://staging.zolaq.az/ | grep -i x-robots-tag
# expect: X-Robots-Tag: noindex, nofollow, noarchive

# 2. Staging robots.txt is deny-all
curl -s https://staging.zolaq.az/robots.txt
# expect: User-Agent: * / Disallow: /

# 3. Production host (when configured later) is permissive
curl -sI https://zolaq.az/ | grep -i x-robots-tag
# expect: NO X-Robots-Tag header

# 4. Production robots.txt is permissive
curl -s https://zolaq.az/robots.txt
# expect: User-Agent: * / Allow: / / Disallow: /admin/ ... (NOT Disallow: /)
```

## Local verification

```powershell
$env:STAGING_NO_INDEX = "true"
npm run dev
# in another shell:
curl -I http://localhost:3000/                # X-Robots-Tag present
curl http://localhost:3000/robots.txt          # Disallow: /
Remove-Item Env:\STAGING_NO_INDEX
# restart dev server
curl -I http://localhost:3000/                # NO X-Robots-Tag
curl http://localhost:3000/robots.txt          # permissive
```

## Reverting at public launch

No code change. On the Production Vercel environment, simply do not set
`STAGING_NO_INDEX`. The proxy and robots.ts both fall through to permissive
behavior automatically. The staging environment can continue running with
`STAGING_NO_INDEX=true` indefinitely.
