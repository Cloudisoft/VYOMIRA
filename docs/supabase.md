# Using Supabase as the database

VYOMIRA runs on any Postgres. Supabase can replace the Railway Postgres service. Prisma, Better Auth
(including Google sign-in), payments and every API stay exactly as they are; only connection settings change.
You also get Supabase's dashboard (table editor, SQL editor, backups, point-in-time recovery on paid plans).

## 1. Create the project

1. supabase.com → New project. Region: **Mumbai (ap-south-1)** — closest to Indian users and to DPDP expectations.
2. Save the database password somewhere safe.

## 2. Copy three values

Supabase → **Connect** (top bar) → *ORMs / Connection string*:

| Variable | Which string | Port |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler**, append `?pgbouncer=true&sslmode=require` | 6543 |
| `DIRECT_URL` | **Session pooler**, append `?sslmode=require` (used only by migrations) | 5432 |
| `DATABASE_CA_CERT` | Project Settings → Database → **SSL configuration → Download certificate**; paste the file's text (or its base64) | — |

Use the *pooler* hosts (`aws-0-…pooler.supabase.com`), not `db.<ref>.supabase.co`: the direct host is IPv6-only
and Railway's outbound network may not reach it.

## 3. Move existing data (optional)

From a machine with Postgres 17 client tools:

```bash
pg_dump "$RAILWAY_DATABASE_PUBLIC_URL" --no-owner --no-privileges --format=custom -f vyomira.dump
```

```bash
pg_restore --no-owner --no-privileges --dbname "$SUPABASE_SESSION_POOLER_URL" vyomira.dump
```

Skip this for a fresh start; the app's start command runs `prisma migrate deploy`, which creates every table.

## 4. Point Railway at Supabase

In the `web` service variables, replace `DATABASE_URL` (currently `${{Postgres.DATABASE_URL}}`) and add
`DIRECT_URL` and `DATABASE_CA_CERT`. Railway redeploys; migrations run against Supabase on boot.
Once it is healthy and data is checked, the Railway Postgres service can be removed.

## Notes

- Row Level Security: the app connects as the `postgres` role and enforces access in the server code, so RLS is
  not required. Do not expose these tables through Supabase's auto-generated REST API to the browser: under
  Project Settings → API, remove `public` from *Exposed schemas*, or enable RLS with no policies on every table.
- Birth details stay encrypted at the application layer (`BIRTH_DATA_ENCRYPTION_KEY`) before they reach Supabase.
- Pool size per instance: `DATABASE_POOL_MAX` (default 10).
