// Sprint 8A admin user lookup. Read-only this sprint — the seed list is the
// source of truth and is exposed to the dev login picker.

import { ADMIN_USERS } from "./seed";
import type { AdminUser } from "./types";

export function listAdmins(): AdminUser[] {
  return ADMIN_USERS.map((a) => ({ ...a }));
}

export function getAdminById(adminId: string): AdminUser | null {
  const a = ADMIN_USERS.find((u) => u.admin_id === adminId);
  return a ? { ...a } : null;
}
