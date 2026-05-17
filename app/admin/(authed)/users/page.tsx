import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { listAdmins } from "@/lib/admin";

export default function AdminUsersPage() {
  const users = listAdmins();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Admin istifadəçilər</h1>
      <p className="text-sm text-foreground-muted">
        Sprint 8A: hesablar seed-dədir. Sprint 8E real auth ilə CRUD əlavə olunacaq.
      </p>
      <AdminTable
        rows={users}
        rowKey={(u) => u.admin_id}
        empty="—"
        columns={[
          { key: "name", header: "Ad", cell: (u) => u.name },
          { key: "email", header: "Email", cell: (u) => u.email ?? "—" },
          { key: "role", header: "Rol", cell: (u) => <Badge tone="brand">{u.role}</Badge> },
          { key: "id", header: "ID", cell: (u) => <code className="text-xs">{u.admin_id}</code> },
        ]}
      />
    </div>
  );
}
