# Production Runbook

## Required environment

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser-safe Supabase access. Configure `SUPABASE_SERVICE_ROLE_KEY` only in server runtime environments; never prefix it with `NEXT_PUBLIC_`, commit it, print it, or expose it to client bundles. `E2E_BASE_URL` is optional for release testing.

## Pre-deployment backup

Before applying migrations, create a Supabase database backup or a `pg_dump` using a protected direct database connection. Record the backup timestamp, source project, PostgreSQL version, migration baseline, and encrypted storage location. Confirm that a restore can be performed into a separate test project. Free-tier projects may not provide the same automated backup retention as paid plans, so verify the current project plan and export manually when necessary.

## Migration order and verification

Apply `scripts/001_*.sql` through `scripts/022_validate_legacy_constraints.sql` numerically, exactly once per environment unless a script explicitly documents repeatability. Run migrations through the Supabase SQL Editor as the database owner. Do not reorder migrations.

Afterward, verify that each application table exists, RLS is enabled, required policies and triggers exist, and this query returns zero application constraints:

```sql
select n.nspname, c.relname, con.conname
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not con.convalidated;
```

The application constraint release gate passes when this application-scoped query returns zero rows. Do not require zero unvalidated constraints globally across the entire Supabase database: a global catalog query can include Supabase-managed infrastructure outside the application's ownership.

Supabase-managed schemas such as `auth`, `storage`, and `realtime` are owned and migrated by Supabase. Treat their constraint state as informational for the application release unless Supabase reports an infrastructure problem. Do not alter their tables, validate or recreate their constraints, change their ownership, or assume managed service roles to make an application migration pass.

## RLS verification

Use separate admin, branch-manager, teacher, and student accounts. Verify direct URL access as well as UI visibility. Confirm branch managers cannot read or mutate another branch, teachers see only assigned teaching data, students see only their own financial/results/submission data, and unauthenticated requests are redirected. Never treat hidden navigation as authorization proof.

## Release tests

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
pnpm test:e2e:install
pnpm test:e2e
```

The E2E suite creates only `V1 E2E`-prefixed users and branches and removes them during teardown. It requires the server-only service-role key in the runner environment. Do not run it against production unless the release owner has explicitly approved creation of isolated temporary records.

## Vercel deployment

Configure Production and Preview environment variables separately in Vercel. Build a preview first, run the smoke checklist, then promote the reviewed commit. Ensure the service-role variable is available only to server functions. Confirm the deployed application uses the intended Supabase project before promotion.

## Post-deployment smoke test

Verify login/logout, dashboard metrics, branches, courses/batches, admissions, students, teachers, timetable, homework, test results, fees, and stock. Confirm India formatting uses INR, `DD/MM/YYYY`, 12-hour time where displayed, and the `Asia/Kolkata` business-time expectation. Repeat representative role-denial and cross-branch checks.

## Invitations and SMTP

Configure the Supabase Site URL and allowed redirect URLs for the production domain. Configure a production SMTP provider, sender identity, rate limits, and invitation/magic-link templates. Test one invitation without exposing its token in logs, screenshots, tickets, or URLs shared with others.

## Rollback and restore

Application rollback means redeploying the previous known-good commit in Vercel. Database migrations are not automatically reversible. Do not run guessed down-migrations. For additive changes, keep compatible columns and policies until the previous application version is stable. For destructive or incompatible failures, stop writes, capture current state, and restore the verified pre-deployment backup into a replacement project or database under an incident plan.

After restore, rotate database and service-role credentials if exposure is suspected, update Vercel environment variables, redeploy, and rerun RLS and smoke tests before reopening access.

## Monitoring and free-tier limits

Monitor Vercel function errors and latency, Supabase database/API/Auth logs, failed invitations, RLS denials, connection usage, storage and database quotas, backup health, and unexpected growth in fees, enrollments, submissions, or stock. Free-tier sleeping, quotas, email limits, log retention, and backup availability can affect reliability; confirm current limits before launch and define an upgrade threshold.
