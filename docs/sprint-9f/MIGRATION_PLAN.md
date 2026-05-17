# Migration plan (Sprint 9F)

## Status

Sprint 9F **did not** run `prisma migrate dev`. The schema is validated, the
client is regenerated, and the SQL preview below is captured for review.
Running the migration is a staging-step in its own right (per the project's
"do not commit, do not migrate in 9F" rule).

## Command to run on staging

```bash
# Make sure DATABASE_URL points at a writable Postgres.
npx prisma migrate dev --name sprint_9f_real_auth
```

After the migration runs:

```bash
# Bootstrap the initial super_admin (idempotent).
INITIAL_ADMIN_EMAIL=ops@zolaq.az \
INITIAL_ADMIN_PASSWORD='<strong-random>' \
INITIAL_ADMIN_NAME='Ops' \
npm run bootstrap:admin

# (Optional) Existing seed data — catalog, dealers, etc.
npm run db:seed
```

## What this migration creates (relative to an empty database)

The 9F-relevant new tables and indexes:

```sql
-- AdminUser, role, session (9E + 9F-revoked_at)
CREATE TABLE "admin_users" (
    "admin_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("admin_id")
);
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

CREATE TABLE "admin_user_roles" (
    "admin_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("admin_id","role")
);
ALTER TABLE "admin_user_roles"
    ADD CONSTRAINT "admin_user_roles_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "admin_users"("admin_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "admin_sessions" (
    "session_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_hash" TEXT,
    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("session_id")
);
CREATE INDEX "admin_sessions_admin_id_expires_at_idx"
    ON "admin_sessions"("admin_id","expires_at");

-- DealerUser, session
CREATE TABLE "dealer_users" (
    "dealer_user_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "email" TEXT,
    "phone_hash" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dealer_users_pkey" PRIMARY KEY ("dealer_user_id")
);
CREATE INDEX "dealer_users_dealer_id_idx" ON "dealer_users"("dealer_id");
CREATE UNIQUE INDEX "dealer_users_dealer_id_email_key"
    ON "dealer_users"("dealer_id","email");

CREATE TABLE "dealer_sessions" (
    "session_id" TEXT NOT NULL,
    "dealer_user_id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_hash" TEXT,
    CONSTRAINT "dealer_sessions_pkey" PRIMARY KEY ("session_id")
);
CREATE INDEX "dealer_sessions_dealer_user_id_expires_at_idx"
    ON "dealer_sessions"("dealer_user_id","expires_at");
CREATE INDEX "dealer_sessions_dealer_id_idx" ON "dealer_sessions"("dealer_id");

-- OtpAttempt (with 9F code_hash, max_attempts, consumed_at, locked_at)
CREATE TABLE "otp_attempts" (
    "attempt_id" TEXT NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_attempts_pkey" PRIMARY KEY ("attempt_id")
);
CREATE INDEX "otp_attempts_phone_hash_created_at_idx"
    ON "otp_attempts"("phone_hash","created_at");
CREATE INDEX "otp_attempts_phone_hash_purpose_created_at_idx"
    ON "otp_attempts"("phone_hash","purpose","created_at");
```

(The full SQL — including the 9B catalog tables — was generated locally with
`npx prisma migrate diff --from-empty --to-schema-datamodel
prisma/schema.prisma --script` and reviewed against the schema.)

## Going from 9E to 9F (already-migrated databases)

If a target environment already ran an earlier 9E migration that created
`admin_users`, `admin_user_roles`, `admin_sessions`, `dealer_users`, and
`otp_attempts`, then 9F's `migrate dev` will:

1. **Add** `dealer_sessions` (table + 2 indexes).
2. **Add** `otp_attempts.code_hash`, `otp_attempts.max_attempts`,
   `otp_attempts.consumed_at`, `otp_attempts.locked_at`.
3. **Add** `otp_attempts_phone_hash_purpose_created_at_idx`.

`otp_attempts.code_hash` is `NOT NULL` with no default. If the table already
has rows (it should not — OTP attempts are short-lived), truncate before
migrating, or temporarily add a default and clear it after:

```sql
TRUNCATE TABLE otp_attempts;
```

## Rollback

```bash
# Drop the new column / table only:
ALTER TABLE otp_attempts
    DROP COLUMN code_hash,
    DROP COLUMN max_attempts,
    DROP COLUMN consumed_at,
    DROP COLUMN locked_at;
DROP INDEX otp_attempts_phone_hash_purpose_created_at_idx;
DROP TABLE dealer_sessions;
```

This is safe because no 9E code reads any of these columns/tables. The fallback
mode of [`lib/db/availability.ts`](../../lib/db/availability.ts) will then put
OTP back in memory until a re-migration.
