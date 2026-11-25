/**
 * Owner decisions 25.11.2026 (start blockers 2, 5, 10): partner page hidden, outdated OS paragraph
 * removed from the imprint, encrypted production backups kept for 30 days (provisional, legal review).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES } from "@/lib/seo/public-pages";

const RETENTION = "deploy/production/backup-retention.sh";
const DAY = 86_400;

function backupDir(ages: Record<string, number>): string {
  const dir = mkdtempSync(join(tmpdir(), "retention-"));
  const now = Date.now() / 1000;
  for (const [name, days] of Object.entries(ages)) {
    const f = join(dir, name);
    writeFileSync(f, "x");
    utimesSync(f, now - days * DAY, now - days * DAY);
  }
  return dir;
}

describe("backup retention (start blocker 5)", () => {
  it("removes only own dumps older than 30 days and leaves everything else", () => {
    const ages: Record<string, number> = { "other-file.age": 90, "amanah_amanah_x.sql.gz": 90, "notes.txt": 90 };
    for (let d = 0; d < 40; d++) ages[`amanah_amanah_${String(d).padStart(2, "0")}.sql.gz.age`] = d;
    const dir = backupDir(ages);
    try {
      const out = execFileSync("bash", [RETENTION, dir, "30", "7"], { encoding: "utf8" });
      const left = readdirSync(dir);
      for (let d = 0; d <= 30; d++) expect(left, `day ${d}`).toContain(`amanah_amanah_${String(d).padStart(2, "0")}.sql.gz.age`);
      for (let d = 31; d < 40; d++) expect(left).not.toContain(`amanah_amanah_${String(d).padStart(2, "0")}.sql.gz.age`);
      expect(left).toEqual(expect.arrayContaining(["other-file.age", "amanah_amanah_x.sql.gz", "notes.txt"]));
      expect(out).toContain("removed 9");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("always keeps the 7 newest, even if all are old, and refuses odd input", () => {
    const ages: Record<string, number> = {};
    for (let d = 0; d < 10; d++) ages[`amanah_amanah_${d}.sql.gz.age`] = 100 + d;
    const dir = backupDir(ages);
    try {
      execFileSync("bash", [RETENTION, dir, "30", "7"], { encoding: "utf8" });
      expect(readdirSync(dir).sort()).toEqual([0, 1, 2, 3, 4, 5, 6].map((d) => `amanah_amanah_${d}.sql.gz.age`));
      for (const args of [[dir, "3"], [dir, "abc"], [join(dir, "missing"), "30"], [""]]) {
        expect(() => execFileSync("bash", [RETENTION, ...args], { stdio: "pipe" })).toThrow();
      }
      expect(readdirSync(dir)).toHaveLength(7);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("runs only after a successful encrypted backup and the deletion notice names the 30 days", () => {
    const script = readFileSync("deploy/production/backup-encrypted.sh", "utf8");
    expect(script.indexOf('RETENTION="$(dirname "$0")/backup-retention.sh"')).toBeGreaterThan(script.indexOf('mv "$TMP" "$OUT"'));
    expect(script.indexOf('mv "$TMP" "$OUT"')).toBeGreaterThan(0);
    expect(script).toContain('"${BACKUP_RETENTION_DAYS:-30}" 7');
    expect(readFileSync("src/components/storage/account-controls.tsx", "utf8")).toContain("spätestens nach 30 Tagen");
  });
});

describe("partner page hidden (start blocker 10)", () => {
  it("answers 404, is not in the sitemap and is not indexable; the content is kept unrouted", () => {
    const page = readFileSync("src/app/partner/page.tsx", "utf8");
    expect(page).toContain("notFound()");
    expect(page).toContain("index: false");
    expect(page).not.toContain("Vermittlung");
    expect(Object.keys(PUBLIC_PAGES)).not.toContain("/partner");
    expect(readFileSync("src/components/partner/partner-page-content.tsx", "utf8")).toContain("export default function PartnerPageContent");
  });
});

describe("imprint (start blocker 2)", () => {
  it("no longer links the discontinued EU OS platform and keeps the consumer dispute statement", () => {
    const imprint = readFileSync("src/app/impressum/page.tsx", "utf8");
    expect(imprint).not.toContain("ec.europa.eu/consumers/odr");
    expect(imprint).not.toContain("Online-Streitbeilegung");
    expect(imprint).toContain("Verbraucherstreitbeilegung");
    expect(imprint).toContain("Verbraucherschlichtungsstelle");
    expect(imprint).toContain('href="/kontakt"');
  });
});

