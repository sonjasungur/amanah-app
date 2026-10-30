#!/usr/bin/env node
/**
 * Encrypts legacy plaintext rows in amanah_data and re-wraps rows to the active key.
 *
 * Default is a dry run (counts only). Writing requires BOTH:
 *   --apply   and   AMANAH_REENCRYPT_CONFIRM=yes
 * Never run against production without a backup and owner approval.
 * Optional: AMANAH_REENCRYPT_USER_IDS="id1,id2" limits the run to these users.
 * Output contains counts and row ids only — no plaintext, no keys.
 *
 * Requires Node >= 22.18 / 24 (native TypeScript type stripping for the shared module).
 */
import { PrismaClient } from "@prisma/client";

const { parseKeyring, reencryptStoredValue } = await import("../src/lib/server/data-encryption.ts");

const apply = process.argv.includes("--apply");
if (apply && process.env.AMANAH_REENCRYPT_CONFIRM !== "yes") {
  console.error("✗ --apply requires AMANAH_REENCRYPT_CONFIRM=yes");
  process.exit(2);
}

const keyring = parseKeyring(process.env);
if (!keyring) {
  console.error("✗ AMANAH_DATA_KEYS is not set");
  process.exit(2);
}

const prisma = new PrismaClient();
const counts = { encrypt_plaintext: 0, rewrap: 0, unchanged: 0, failed: 0 };
try {
  const onlyUsers = process.env.AMANAH_REENCRYPT_USER_IDS?.split(",").map((s) => s.trim()).filter(Boolean);
  const rows = await prisma.amanahData.findMany({
    where: onlyUsers?.length ? { userId: { in: onlyUsers } } : undefined,
    select: { id: true, userId: true, data: true },
  });
  for (const row of rows) {
    try {
      const { action, value } = reencryptStoredValue(row.data, row.userId, keyring);
      counts[action] += 1;
      if (apply && action !== "unchanged") {
        await prisma.amanahData.update({ where: { id: row.id }, data: { data: value } });
      }
    } catch {
      counts.failed += 1;
      console.error(`✗ row ${row.id}: could not be processed (wrong key or damaged data)`);
    }
  }
  console.log(`${apply ? "applied" : "dry run"} · active key ${keyring.active} ·`, JSON.stringify(counts));
  process.exitCode = counts.failed > 0 ? 1 : 0;
} finally {
  await prisma.$disconnect();
}
