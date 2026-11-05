import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations use DIRECT_URL when set (e.g. Supabase session pooler, port 5432) because the
  // transaction pooler (port 6543) used at runtime cannot run migrations.
  // `prisma generate` needs no database; a placeholder keeps image builds working without secrets.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build" },
});
