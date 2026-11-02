import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Whatever a client component imports ends up in JavaScript anyone can download, whether a page
 * shows it or not. So unreviewed texts must stay out of everything client components can reach.
 */
const SRC = resolve("src");
const FORBIDDEN = [
  "modules/islamic-knowledge/catalog.ts",
  "modules/islamic-knowledge/drafts/",
  "modules/islamic-knowledge/archive/",
  "lib/knowledge/wissen-topics.ts",
  "lib/knowledge/entries.ts",
  "lib/knowledge/janazah.ts",
  "lib/knowledge/barzakh.ts",
  "lib/knowledge/testament-erbe.ts",
  "lib/knowledge/ghusl-kafan.ts",
  "lib/knowledge/sadaqa-jariya.ts",
  "lib/knowledge/patientenverfuegung.ts",
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : walk(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  return [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(existsSync) ?? null;
}

/** Type-only imports leave no code behind. Named imports where every name is a type do not count here: strictest reading. */
function importsOf(file: string): string[] {
  const code = readFileSync(file, "utf8");
  const specs = [...code.matchAll(/^\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+"([^"]+)"/gm)].map((m) => m[1]);
  return specs.map((s) => resolveImport(file, s)).filter((f): f is string => Boolean(f));
}

function reachable(start: string): Map<string, string> {
  const seen = new Map<string, string>([[start, start]]);
  const queue = [start];
  while (queue.length > 0) {
    const file = queue.pop()!;
    for (const next of importsOf(file)) {
      if (!seen.has(next)) {
        seen.set(next, file);
        queue.push(next);
      }
    }
  }
  return seen;
}

describe("client bundle", () => {
  const clients = walk(SRC).filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8")));

  it("finds client components at all", () => {
    expect(clients.length).toBeGreaterThan(20);
    expect(clients.map((f) => relative(SRC, f))).toContain("components/wissen/wissen-hub-view.tsx");
  });

  it("no client component can reach unreviewed knowledge texts", () => {
    const leaks = clients.flatMap((client) =>
      [...reachable(client).keys()]
        .map((f) => relative(SRC, f))
        .filter((f) => FORBIDDEN.some((bad) => f === bad || f.startsWith(bad)))
        .map((f) => `${relative(SRC, client)} -> ${f}`),
    );
    expect(leaks).toEqual([]);
  });
});
