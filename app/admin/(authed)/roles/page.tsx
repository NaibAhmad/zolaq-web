import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import {
  ADMIN_ROLE_PERMISSIONS,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";

// Sprint 9E: the matrix is derived from lib/auth/permissions.ts.
// Sprint 10I-F: visible permission labels now flow through translations.

const PERMISSION_KEY: Record<Permission, TranslationKey> = {
  "catalog.read": "adminRoles.perm_catalogRead",
  "catalog.write": "adminRoles.perm_catalogWrite",
  "dealers.manage": "adminRoles.perm_dealersManage",
  "offers.review": "adminRoles.perm_offersReview",
  "offers.publish": "adminRoles.perm_offersPublish",
  "content.write": "adminRoles.perm_contentWrite",
  "qa.moderate": "adminRoles.perm_qaModerate",
  "market_pulse.write": "adminRoles.perm_marketPulseWrite",
  "leads.read": "adminRoles.perm_leadsRead",
  "ads.manage": "adminRoles.perm_adsManage",
  "invoices.manage": "adminRoles.perm_invoicesManage",
  "payments.manage": "adminRoles.perm_paymentsManage",
  "audit.read": "adminRoles.perm_auditRead",
  "users.manage": "adminRoles.perm_usersManage",
  "roles.read": "adminRoles.perm_rolesRead",
  "media.write": "adminRoles.perm_mediaWrite",
  "media.review": "adminRoles.perm_mediaReview",
  "dealer.profile.view": "adminRoles.perm_dealerProfileView",
  "dealer.profile.request_update": "adminRoles.perm_dealerProfileRequestUpdate",
  "dealer.offer.view": "adminRoles.perm_dealerOfferView",
  "dealer.offer.create": "adminRoles.perm_dealerOfferCreate",
  "dealer.offer.update_own_draft": "adminRoles.perm_dealerOfferUpdateOwnDraft",
  "dealer.media.upload": "adminRoles.perm_dealerMediaUpload",
  "dealer.ad_request.create": "adminRoles.perm_dealerAdRequestCreate",
  "dealer.invoice.view": "adminRoles.perm_dealerInvoiceView",
  "dealer.payment_proof.upload": "adminRoles.perm_dealerPaymentProofUpload",
  "dealer.lead.view_own": "adminRoles.perm_dealerLeadViewOwn",
  "dealer.test_drive.view_own": "adminRoles.perm_dealerTestDriveViewOwn",
  "dealer.submission.view_own": "adminRoles.perm_dealerSubmissionViewOwn",
};

export default async function AdminRolesPage() {
  const t = await getServerT();
  const rows = PERMISSIONS.map((perm) => ({
    perm,
    label: t(PERMISSION_KEY[perm]),
  }));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminRoles.title")}</h1>
      <p className="text-sm text-foreground-muted">
        {t("adminRoles.descriptionWithFile", { file: "lib/auth/permissions.ts" })}
      </p>
      <AdminTable
        rows={rows}
        rowKey={(r) => r.perm}
        empty={t("adminRoles.emptyPerm")}
        columns={[
          { key: "label", header: t("adminRoles.permission"), cell: (r) => r.label },
          ...ADMIN_ROLES.map((role) => ({
            key: role,
            header: <Badge tone="brand">{role}</Badge>,
            cell: (r: { perm: Permission }) =>
              ADMIN_ROLE_PERMISSIONS[role].has(r.perm) ? "✓" : "—",
          })),
        ]}
      />
    </div>
  );
}
