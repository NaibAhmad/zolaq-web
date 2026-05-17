# Sprint 8E-F-G — Staging Readiness

## Shipped

### 8E — Ads / Revenue / Manual Invoice
- `lib/ads/{types,seed,store,labels}.ts` — 12 packages, 10 placements, 13 statuses, 3 labels. State-machine transitions with label-required guard for public-visible statuses.
- `lib/invoices/{types,seed,store}.ts` — 6 statuses with manual-only payment workflow.
- `lib/payments/{types,seed,store}.ts` — payment proof upload + admin review.
- Admin pages: `/admin/ads`, `/admin/ads/new`, `/admin/ads/[id]`, `/admin/invoices`, `/admin/invoices/new`, `/admin/invoices/[id]`, `/admin/payments`, `/admin/payments/[id]`.
- Dealer pages: `/dealer/ad-requests`, `/dealer/ad-requests/new`, `/dealer/ad-requests/[id]`, `/dealer/invoices`, `/dealer/invoices/[id]`, `/dealer/payment-proof`.
- Internal APIs: full CRUD + approve/reject/request-revision/activate for ads; create/cancel/mark-overdue for invoices; approve/reject for payment proofs.
- Dealer APIs: ad-request create + own-row reads; invoice own-row reads; payment-proof upload.
- Audit actions: 18 new entries covering every commercial transition (`ad_request.*`, `invoice.*`, `payment.*`).

### 8F — Bazar Nəbzi + P0-lite Gamification
- `lib/market-pulse/{types,seed,store}.ts` — daily/weekly/monthly topics, 7-state lifecycle, one-vote-per-user enforcement, aggregation.
- `lib/gamification/{badges,points,hooks,activity}.ts` — 5 P0 badges, 7 point actions with daily caps, unified activity timeline.
- Admin pages: `/admin/market-pulse`, `/admin/market-pulse/new`, `/admin/market-pulse/[id]`.
- Public surfaces: `/qa` with 6 tabs (Suallar, Bazar Nəbzi, Günlük, Həftəlik, Aylıq, Tarixçə); homepage `HomeMarketPulse` block between content teaser and dealer teaser.
- Vote API at `/api/market-pulse/topics/[id]/vote` — OTP-gated, one-vote-per-user, awards `market_observer` badge + capped points via `onBazarVote`.
- Profile additions: `/profile/badges` page; `/profile/history` extended with Bazar Nəbzi & nişan activity section; Nişanlarım quick link on `/profile`.
- Audit actions: 11 new entries (`bazar_topic.*`, `bazar_vote.cast`, `badge.grant`, `point.grant`, `point.reverse`).

### 8G — Final QA
- `docs/sprint-8g/REGRESSION_CHECKLIST.md` — 45-route manual checklist.
- `docs/sprint-8g/SECURITY_QA.md` — 8 invariants with enforcement file references + reviewer commands.
- `docs/sprint-8g/READINESS.md` — this file.
- Build gates: `npm run lint`, `npx tsc --noEmit`, `npm run build` (results in task output).

## Deferred (explicit out-of-scope, per plan)

- **Real auth.** Admin and dealer panels keep the Sprint 8A-D mock cookies. Password / JWT swap remains a future sprint.
- **Real file storage** for payment-proof. `file_ref` is a free-form string; uploads carry metadata only.
- **Online payments.** Card payments, wallets, billing dashboards are not in scope.
- **Moderation queue.** `/admin/moderation` not built — `audit-log` covers commercial trace; Q&A reports queue is future work.
- **Public profile / leaderboard.** Badges and points are private. No social surface in this sprint.
- **Automated tests.** Regression coverage is the manual checklist + build gates. No Playwright / vitest harness added.
- **DB migration.** All Sprint 8 stores remain in-memory `globalThis`-pinned. Seam for future Prisma migration is `lib/<domain>/store.ts` per domain.

## Gamification side-effects wired

- `onBazarVote` — fires on POST `/api/market-pulse/topics/[id]/vote`. Awards `market_observer` badge and 5 points (capped 3/day).
- `onEncyclopediaRead` — fires on `/encyclopedia/[slug]` SSR when an OTP session is present. Awards `encyclopedia_reader` badge and 2 points (capped 5/day, deduped per slug).

The other hooks (`onComparison`, `onQaParticipation`, `onVerifiedLead`, `onOfficialOfferReceived`, `onNewsRead`) are defined and exported but not wired in this pass — the originating flows (comparison tracking, customer QA submission, lead conversion notifications) are outside the 8E-F-G bullet list and changing them would touch Step 5/6/7 product flow, which the spec forbids.

## Known gaps

- The `/api/profile/history` endpoint must already exist in Sprint 7 for the existing decision history flow. Sprint 8F adds `/api/profile/activity` and a parallel read on the page — if the existing `/api/profile/history` endpoint is missing or auth-gated differently, the timeline render falls back to error state.
- `pickFeaturedActiveTopic()` always picks weekly > daily > monthly. If no active topic exists, the homepage block hides itself (returns `null`).
- Invoice creation flow auto-advances the linked ad-request through `invoice_required → invoice_sent` and the invoice through `pending → invoice_sent` in a single POST. This is intentional but means the `pending` state is invisible to the dealer.

## Build commands

```pwsh
npm run lint
npx tsc --noEmit
npm run build
```

All three must exit 0 before staging deploy.

## Forward-looking

Community direction beyond Sprint 8F (model communities, owner reviews,
verified-owner badge, shareable Q&A cards) is locked in
[../sprint-8f/COMMUNITY_DECISION_LAYER.md](../sprint-8f/COMMUNITY_DECISION_LAYER.md).
Engineering should treat that doc as the single source of truth for Sprint 9H,
Sprint 10 beta, and post-launch community scope. **Zolaq is structured
automotive decision data, not a Facebook clone.**
