import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ADMIN_ROLES } from "@/lib/auth/constants";
import {
  ADMIN_ROLE_PERMISSIONS,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions";

// Sprint 9E: the matrix is now derived from lib/auth/permissions.ts. Adding
// or revoking an admin permission means editing one file — this page just
// renders what's there.

const PERMISSION_LABEL_AZ: Record<Permission, string> = {
  "catalog.read": "Kataloq (oxu)",
  "catalog.write": "Kataloq (redaktə)",
  "dealers.manage": "Dilerlər",
  "offers.review": "Təklif yoxlaması",
  "offers.publish": "Təklif təsdiqi (publish)",
  "content.write": "Məzmun (Xəbər/Ensiklopediya)",
  "qa.moderate": "Sual-cavab moderasiyası",
  "market_pulse.write": "Bazar Nəbzi",
  "leads.read": "Sorğular (Leads)",
  "ads.manage": "Reklam tələbləri",
  "invoices.manage": "Fakturalar",
  "payments.manage": "Ödəniş təsdiqi",
  "audit.read": "Audit jurnalı",
  "users.manage": "İstifadəçilər",
  "roles.read": "Rollar (oxu)",
  "media.write": "Media yükləmə",
  "media.review": "Media yoxlaması",
  "dealer.profile.view": "Diler profili (oxu)",
  "dealer.profile.request_update": "Diler profili (yenilik tələbi)",
  "dealer.offer.view": "Diler təklifləri (oxu)",
  "dealer.offer.create": "Diler təklifi yaratmaq",
  "dealer.offer.update_own_draft": "Diler təklifi redaktə (draft)",
  "dealer.media.upload": "Diler media yükləmə",
  "dealer.ad_request.create": "Reklam tələbi yaratmaq",
  "dealer.invoice.view": "Diler fakturaları (oxu)",
  "dealer.payment_proof.upload": "Ödəniş sübutu yükləmə",
  "dealer.lead.view_own": "Öz sorğularını oxumaq",
  "dealer.test_drive.view_own": "Test-drive sorğuları (oxu)",
  "dealer.submission.view_own": "Diler təqdimləri (oxu)",
};

export default function AdminRolesPage() {
  const rows = PERMISSIONS.map((perm) => ({
    perm,
    label: PERMISSION_LABEL_AZ[perm],
  }));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Rollar və icazələr</h1>
      <p className="text-sm text-foreground-muted">
        Yalnız oxumaq üçündür. Matris{" "}
        <code>lib/auth/permissions.ts</code> faylından oxunur — dəyişiklik
        yalnız orada edilməlidir.
      </p>
      <AdminTable
        rows={rows}
        rowKey={(r) => r.perm}
        empty="—"
        columns={[
          { key: "label", header: "İcazə", cell: (r) => r.label },
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
