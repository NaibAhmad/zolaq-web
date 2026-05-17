# Sprint 9J — Backup Policy

## Database

| Concern | Policy |
|---|---|
| Frequency | Daily logical backup (`pg_dump` or hosting-provider equivalent). |
| Retention | 7 daily backups + 1 weekly (kept 4 weeks) + 1 monthly (kept 12 months). |
| Encryption | At-rest encryption mandatory; the hosting provider's default suffices if it uses AES-256. |
| Location | Off-site from the primary DB host. For managed Postgres, use the provider's cross-region snapshot feature. |
| Restore drill | Quarterly: restore the most recent backup to a throwaway instance and run [SECURITY_QA_CHECKLIST.md](./SECURITY_QA_CHECKLIST.md) §"Data integrity" against it. Capture the result in `docs/sprint-X/RESTORE_DRILL_<date>.md`. |
| Pre-deploy backup | Always take an additional manual backup IMMEDIATELY before deploying a Prisma migration that contains `DROP`, `ALTER COLUMN TYPE`, or any operation flagged in [docs/sprint-9i/DATABASE_MIGRATION_RUNBOOK.md](../sprint-9i/DATABASE_MIGRATION_RUNBOOK.md) §"Schema change checklist". |

## Media (`/public/uploads/`)

| Concern | Policy |
|---|---|
| Current state | Local filesystem only (`MEDIA_STORAGE_PROVIDER=local`). Not backed up unless the host's volume snapshots include it. |
| Production requirement | When `MEDIA_STORAGE_PROVIDER` flips to a cloud provider (`s3` / `r2` / `supabase`, per [docs/sprint-9d/STORAGE_PROVIDER_DECISION.md](../sprint-9d/STORAGE_PROVIDER_DECISION.md)), enable versioning + 30-day soft-delete on the bucket. |
| Restore drill | Quarterly: pull a sample of 20 random uploaded files from backup and verify byte-identical to the source. |
| **Risk this sprint** | Local-only media on a single host is a data-loss risk for any user-uploaded content. Mark as a blocker for taking real user traffic; staging is acceptable. |

## Source code

- Git is the canonical source. Mirror the repo to at least two hosting providers (e.g., GitHub primary + an internal GitLab mirror, OR GitHub + offline encrypted bundle stored monthly).
- Tags for every release; tags are immutable.
- `.env.example` is the only env file in the repo and is part of the standard backup.

## Secrets

- Secrets are NOT backed up by repo backup. They live in the hosting provider's env store.
- Maintain a separately-encrypted offline copy of the production env vars (encrypted with a key held by two named people; rotate the copy on every production env change).

## Restore time objectives

| Target | RPO (max data loss) | RTO (max downtime) |
|---|---|---|
| DB | 24h (daily backup) | 1h (restore from latest snapshot) |
| Media | 24h | 4h (re-sync from cloud bucket) |
| Application | 0 (code is in git) | 15 min (redeploy) |

These are targets, not contracts. Tighten when the product has paying users.
