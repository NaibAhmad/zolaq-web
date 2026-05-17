import {
  ADMIN_ROLES,
  DEALER_ROLES,
  type AdminRole,
  type DealerRole,
} from "./constants";

// Sprint 9E: single source of truth for what each role can do. Sidebar
// filtering, the read-only roles page, and (newly) the
// `requireAdminPermission` API helper all read from here so additions /
// revocations land in one file instead of leaking into per-route checks.

export const PERMISSIONS = [
  // catalog
  "catalog.read",
  "catalog.write",
  // dealer admin side
  "dealers.manage",
  "offers.review", // approve, reject, request_revision
  "offers.publish", // final publish — super_admin only by current policy
  // content
  "content.write",
  "qa.moderate",
  "market_pulse.write",
  // sales
  "leads.read",
  "ads.manage",
  "invoices.manage",
  "payments.manage",
  // platform admin
  "audit.read",
  "users.manage",
  "roles.read",
  // media
  "media.write",
  "media.review",
  // Sprint 9F — granular dealer-side per-action permissions. Owner/manager/staff
  // matrix below. These are checked by `requireDealerPermission` per route.
  "dealer.profile.view",
  "dealer.profile.request_update",
  "dealer.offer.view",
  "dealer.offer.create",
  "dealer.offer.update_own_draft",
  "dealer.media.upload",
  "dealer.ad_request.create",
  "dealer.invoice.view",
  "dealer.payment_proof.upload",
  "dealer.lead.view_own",
  "dealer.test_drive.view_own",
  "dealer.submission.view_own",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

type AdminMatrix = Record<AdminRole, ReadonlySet<Permission>>;
type DealerMatrix = Record<DealerRole, ReadonlySet<Permission>>;

function set(...perms: Permission[]): ReadonlySet<Permission> {
  return new Set(perms);
}

export const ADMIN_ROLE_PERMISSIONS: AdminMatrix = {
  super_admin: set(...PERMISSIONS),
  internal_ops_admin: set(
    "catalog.read",
    "catalog.write",
    "dealers.manage",
    "offers.review",
    "ads.manage",
    "invoices.manage",
    "payments.manage",
    "audit.read",
    "media.write",
    "media.review",
  ),
  content_manager: set(
    "catalog.read",
    "content.write",
    "qa.moderate",
    "market_pulse.write",
    "media.write",
  ),
  sales_lead_manager: set(
    "catalog.read",
    "leads.read",
    "ads.manage",
    "invoices.manage",
    "payments.manage",
  ),
  moderator: set("qa.moderate"),
};

// Dealer-side matrix. Owner == full dealer scope; manager == day-to-day
// operations; staff == view-mostly. Real per-action enforcement is wired in
// Sprint 9F — for now, the dealer API routes treat any authenticated dealer
// as `owner` (default in DealerSession decode) so existing behavior is
// preserved.
export const DEALER_ROLE_PERMISSIONS: DealerMatrix = {
  owner: set(
    "catalog.read",
    "offers.review",
    "leads.read",
    "invoices.manage",
    "payments.manage",
    "media.write",
    // Sprint 9F: owner gets all per-action dealer permissions.
    "dealer.profile.view",
    "dealer.profile.request_update",
    "dealer.offer.view",
    "dealer.offer.create",
    "dealer.offer.update_own_draft",
    "dealer.media.upload",
    "dealer.ad_request.create",
    "dealer.invoice.view",
    "dealer.payment_proof.upload",
    "dealer.lead.view_own",
    "dealer.test_drive.view_own",
    "dealer.submission.view_own",
  ),
  manager: set(
    "catalog.read",
    "offers.review",
    "leads.read",
    "media.write",
    // Sprint 9F: manager handles operations but not money. No invoice view, no
    // payment proof, no profile-update requests, no ad-request creation.
    "dealer.profile.view",
    "dealer.offer.view",
    "dealer.offer.create",
    "dealer.offer.update_own_draft",
    "dealer.media.upload",
    "dealer.lead.view_own",
    "dealer.test_drive.view_own",
    "dealer.submission.view_own",
  ),
  staff: set(
    "catalog.read",
    "leads.read",
    // Sprint 9F: staff is read-only across dealer surface.
    "dealer.profile.view",
    "dealer.offer.view",
    "dealer.lead.view_own",
    "dealer.test_drive.view_own",
    "dealer.submission.view_own",
  ),
};

export function adminCan(role: AdminRole, perm: Permission): boolean {
  return ADMIN_ROLE_PERMISSIONS[role].has(perm);
}

export function dealerCan(role: DealerRole, perm: Permission): boolean {
  return DEALER_ROLE_PERMISSIONS[role].has(perm);
}

// Helper for the sidebar / docs: list every role that has a given permission.
export function adminRolesWith(perm: Permission): AdminRole[] {
  return ADMIN_ROLES.filter((r) => ADMIN_ROLE_PERMISSIONS[r].has(perm));
}

export function dealerRolesWith(perm: Permission): DealerRole[] {
  return DEALER_ROLES.filter((r) => DEALER_ROLE_PERMISSIONS[r].has(perm));
}
