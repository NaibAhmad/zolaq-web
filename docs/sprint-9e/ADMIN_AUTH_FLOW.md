# Admin Auth Flow — Sprint 9E

## Current (post-9E) flow

```
[user]
  GET /admin/login
    -> if zlq_admin_session valid -> 303 /admin/dashboard
    -> else if DEV_AUTH_MODE=true -> render <RoleSwitcher> (seed admin picker)
    -> else                       -> render <PasswordSignInPlaceholder>

[user]
  POST /api/admin/auth/login  body={ admin_id, redirect_to? }
    -> if !DEV_AUTH_MODE -> audit admin.login.blocked_production_mock; 503
    -> if !admin_id      -> 400 VALIDATION_ERROR
    -> if !getAdminById  -> audit admin.login.failed; 404
    -> setAdminSession({ adminId, name, role })    // HMAC-signed cookie
    -> writeAudit({ action: "admin.login" })
    -> 303 /admin/dashboard (or redirect_to)

[user]
  GET /admin/(authed)/*       (layout)
    -> getAdminSession()
    -> if null -> 303 /admin/login
    -> render with session.role -> AdminSidebar filters by permission

[user]
  POST /api/admin/...         (any internal route)
    -> requireAdmin(...) or requireAdminPermission(perm)
    -> 401 if no session, 403 if role lacks perm (+ audit auth.forbidden)

[user]
  POST /api/admin/auth/logout
    -> writeAudit({ action: "admin.logout" })
    -> clearAdminSession()
    -> 303 /admin/login
```

## Files

- Page: [app/admin/login/page.tsx](../../app/admin/login/page.tsx)
- Layout guard: [app/admin/(authed)/layout.tsx](../../app/admin/(authed)/layout.tsx)
- Login route: [app/api/admin/auth/login/route.ts](../../app/api/admin/auth/login/route.ts)
- Logout route: [app/api/admin/auth/logout/route.ts](../../app/api/admin/auth/logout/route.ts)
- Session helper: [lib/auth/admin-session.ts](../../lib/auth/admin-session.ts)
- API guard: [lib/admin/api-utils.ts](../../lib/admin/api-utils.ts) — `requireAdmin`, `requireAdminPermission`
- Mock seed list (DEV_AUTH_MODE only): [lib/admin/store.ts](../../lib/admin/store.ts)
- Mock picker UI (DEV_AUTH_MODE only): [components/admin/RoleSwitcher.tsx](../../components/admin/RoleSwitcher.tsx)
- Placeholder (prod): [components/admin/PasswordSignInPlaceholder.tsx](../../components/admin/PasswordSignInPlaceholder.tsx)

## Roles

Defined in [lib/auth/constants.ts](../../lib/auth/constants.ts) `ADMIN_ROLES`:

- `super_admin` — full access (catalog, dealers, content, audit, users, roles, publish offers)
- `internal_ops_admin` — catalog, dealers, offer review (not publish), audit, media
- `content_manager` — content CRUD (news, encyclopedia, Q&A), media, market-pulse
- `sales_lead_manager` — leads, ads, invoices, payments
- `moderator` — Q&A moderation only

Each role's permission set lives in [lib/auth/permissions.ts](../../lib/auth/permissions.ts) `ADMIN_ROLE_PERMISSIONS`. See [RBAC_PERMISSION_MATRIX.md](RBAC_PERMISSION_MATRIX.md).

## Sprint 9F target

- Replace `getAdminById` lookup in `/api/admin/auth/login` with `verifyAdminPassword({ email, password })` (stub at [lib/auth/admin-user-repository.ts](../../lib/auth/admin-user-repository.ts)).
- Swap `<RoleSwitcher>` for a real `<PasswordSignInForm>` and remove the DEV_AUTH_MODE branch from the login page (mock stays as `DEV_AUTH_MODE` for tests).
- Run the AdminUser/AdminSession migration; seed initial super_admin row from `lib/admin/seed.ts`.
- Wire `AdminSession.revoked_at` so a session can be killed server-side.
- Add `failed_login_count` lockout (3 wrong passwords → 15 min freeze).
