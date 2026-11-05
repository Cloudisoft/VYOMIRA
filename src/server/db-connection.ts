import type { PoolConfig } from "pg";

/**
 * Postgres connection options for the Prisma pg adapter.
 * Works with any Postgres (local, Railway, Supabase, Neon…).
 *
 * Supabase serves certificates from its own root CA, which Node does not trust by default, and
 * node-postgres treats `sslmode=require` as full verification. Set DATABASE_CA_CERT to the CA from
 * Supabase → Project Settings → Database → SSL configuration (PEM text, or base64 of it) to get
 * verified TLS. The URL's ssl* parameters are dropped in that case because node-postgres lets them
 * override the explicit `ssl` option.
 */
export function pgConfig(url = process.env.DATABASE_URL!, caCert = process.env.DATABASE_CA_CERT): PoolConfig {
  const max = Number(process.env.DATABASE_POOL_MAX) || 10;
  if (!caCert) return { connectionString: url, max };
  const ca = caCert.includes("BEGIN CERTIFICATE") ? caCert.replace(/\\n/g, "\n") : Buffer.from(caCert, "base64").toString("utf8");
  const u = new URL(url);
  for (const k of [...u.searchParams.keys()]) if (k.startsWith("ssl") || k === "uselibpqcompat") u.searchParams.delete(k);
  return { connectionString: u.toString(), ssl: { ca, rejectUnauthorized: true }, max };
}
