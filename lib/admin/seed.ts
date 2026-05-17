// Seed admin users — one per role so the dev login picker can exercise every
// permission scope. TODO Sprint 8E: replace with DB-backed accounts.

import type { AdminUser } from "./types";

export const ADMIN_USERS: readonly AdminUser[] = [
  {
    admin_id: "admin_super",
    name: "Master Admin",
    role: "super_admin",
    email: "master@zolaq.local",
  },
  {
    admin_id: "admin_ops",
    name: "Internal Ops",
    role: "internal_ops_admin",
    email: "ops@zolaq.local",
  },
  {
    admin_id: "admin_content",
    name: "Content Manager",
    role: "content_manager",
    email: "content@zolaq.local",
  },
  {
    admin_id: "admin_sales",
    name: "Sales Lead Manager",
    role: "sales_lead_manager",
    email: "sales@zolaq.local",
  },
  {
    admin_id: "admin_mod",
    name: "Moderator",
    role: "moderator",
    email: "mod@zolaq.local",
  },
];
