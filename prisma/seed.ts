import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgConfig } from "../src/server/db-connection";
import { RULE_REGISTRY } from "../src/lib/interpret/rule-catalog";
import { COMPUTATION_VERSION } from "../src/lib/astro/chart";

const db = new PrismaClient({ adapter: new PrismaPg(pgConfig()) });

async function main() {
  await db.computationVersion.upsert({ where: { id: COMPUTATION_VERSION.id }, create: { id: COMPUTATION_VERSION.id, conventions: COMPUTATION_VERSION as never }, update: {} });
  for (const r of RULE_REGISTRY) {
    await db.interpretationRule.upsert({
      where: { key_version: { key: r.key, version: r.version } },
      create: { key: r.key, version: r.version, category: r.category, title: r.title, condition: { ref: r.key }, body: r.body, sources: r.sources },
      update: { title: r.title, body: r.body, sources: r.sources },
    });
  }
  console.log(`seeded ${RULE_REGISTRY.length} rules and computation version ${COMPUTATION_VERSION.id}`);
}
main().finally(() => db.$disconnect());
