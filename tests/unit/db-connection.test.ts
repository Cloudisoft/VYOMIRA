import { describe, expect, it } from "vitest";
import { pgConfig } from "@/server/db-connection";

const PEM = "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----";

describe("pgConfig", () => {
  it("passes the URL through without a CA", () => {
    expect(pgConfig("postgresql://u:p@h:5432/db?sslmode=require", undefined)).toMatchObject({ connectionString: "postgresql://u:p@h:5432/db?sslmode=require" });
  });
  it("verifies TLS with a supplied CA and drops URL ssl params", () => {
    const c = pgConfig("postgresql://u:p@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true", PEM);
    expect(c.connectionString).toBe("postgresql://u:p@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
    expect(c.ssl).toEqual({ ca: PEM, rejectUnauthorized: true });
  });
  it("accepts a base64-encoded CA", () => {
    const c = pgConfig("postgresql://u:p@h/db", Buffer.from(PEM).toString("base64"));
    expect((c.ssl as { ca: string }).ca).toBe(PEM);
  });
});
