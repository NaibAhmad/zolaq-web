# RBAC Permission Matrix — Sprint 9E

Single source of truth: [lib/auth/permissions.ts](../../lib/auth/permissions.ts). The read-only `/admin/roles` page and the [components/admin/AdminSidebar.tsx](../../components/admin/AdminSidebar.tsx) both render from this module. To grant or revoke a permission, edit `lib/auth/permissions.ts` only — the matrix below is generated from it.

## Admin matrix

| Permission | super_admin | internal_ops_admin | content_manager | sales_lead_manager | moderator |
|---|---|---|---|---|---|
| `catalog.read` | ✓ | ✓ | ✓ | ✓ | — |
| `catalog.write` | ✓ | ✓ | — | — | — |
| `dealers.manage` | ✓ | ✓ | — | — | — |
| `offers.review` | ✓ | ✓ | — | — | — |
| `offers.publish` | ✓ | — | — | — | — |
| `content.write` | ✓ | — | ✓ | — | — |
| `qa.moderate` | ✓ | — | ✓ | — | ✓ |
| `market_pulse.write` | ✓ | — | ✓ | — | — |
| `leads.read` | ✓ | — | — | ✓ | — |
| `ads.manage` | ✓ | ✓ | — | ✓ | — |
| `invoices.manage` | ✓ | ✓ | — | ✓ | — |
| `payments.manage` | ✓ | ✓ | — | ✓ | — |
| `audit.read` | ✓ | ✓ | — | — | — |
| `users.manage` | ✓ | — | — | — | — |
| `roles.read` | ✓ | — | — | — | — |
| `media.write` | ✓ | ✓ | ✓ | — | — |
| `media.review` | ✓ | ✓ | — | — | — |

## Dealer matrix

| Permission | owner | manager | staff |
|---|---|---|---|
| `catalog.read` | ✓ | ✓ | ✓ |
| `offers.review` | ✓ | ✓ | — |
| `leads.read` | ✓ | ✓ | ✓ |
| `invoices.manage` | ✓ | — | — |
| `payments.manage` | ✓ | — | — |
| `media.write` | ✓ | ✓ | — |

(Permissions not in this table are admin-only; dealers cannot have them.)

## How to enforce a permission

API route (preferred for new code):

```ts
const auth = await requireAdminPermission(request, "media.write");
if ("response" in auth) return auth.response;
// auth.session is typed AdminSession
```

Sidebar / UI:

```tsx
import { adminCan } from "@/lib/auth/permissions";
{adminCan(role, "audit.read") && <Link href="/admin/audit-log">…</Link>}
```

Migration note: existing routes that call `requireAdmin(request, "super_admin", "internal_ops_admin")` still work and don't need to be touched. Migrate opportunistically when editing a route for other reasons.

## Forbidden = audit

Every 403 from `requireAdmin` / `requireAdminPermission` fire-and-forget writes an `auth.forbidden` row with `entity_type: "route"`, `entity_id: <pathname>`, `note: required=<perm-or-roles>`. Spikes in this metric indicate a missing nav guard or a hostile client.
