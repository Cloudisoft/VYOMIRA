import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // `prisma generate` needs no database; a placeholder keeps image builds working without secrets.
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build" },
});
