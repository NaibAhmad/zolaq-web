// Sprint 9F: bootstrap the initial super_admin row.
//
// Reads INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_NAME from
// the environment, hashes the password with node:crypto scrypt, and upserts
// the AdminUser + super_admin role. Idempotent — safe to re-run; updates the
// existing password_hash. Never logs the password.
//
// Usage:
//   INITIAL_ADMIN_EMAIL=ops@zolaq.az \
//   INITIAL_ADMIN_PASSWORD='change-me-strong' \
//   INITIAL_ADMIN_NAME='Ops' \
//   npm run bootstrap:admin

import { hashPassword } from "@/lib/auth/password";
import { upsertAdmin } from "@/lib/auth/admin-user-repository";

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(
      `[bootstrap-admin] ${name} is required. Set it before running this script.`,
    );
  }
  return v.trim();
}

async function main(): Promise<void> {
  const email = readEnv("INITIAL_ADMIN_EMAIL");
  const password = readEnv("INITIAL_ADMIN_PASSWORD");
  const displayName = process.env.INITIAL_ADMIN_NAME?.trim() || email.split("@")[0];

  const password_hash = await hashPassword(password);
  const admin = await upsertAdmin({
    email,
    display_name: displayName,
    password_hash,
    roles: ["super_admin"],
  });

  // Never print the password. Print only non-sensitive identifiers.
  console.log(
    `[bootstrap-admin] ok: admin_id=${admin.admin_id} email=${admin.email} roles=${admin.roles.join(",")}`,
  );
}

main().catch((err) => {
  console.error("[bootstrap-admin] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
