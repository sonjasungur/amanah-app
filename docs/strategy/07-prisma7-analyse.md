# Prisma 6.19.3 → Prisma 7: Analyse für amanah-app

Stand: 2026-10-30. Nur gelesen, nichts geändert. Branch `feat/vorsorge-testament-foundation`.
Es wurden keine Tests ausgeführt (`NOT_RUN`) und keine Datenbankverbindung aufgebaut.

## 0. Geprüfte Fakten (Befehle im Repo, nur lesend)

| Prüfung | Ergebnis |
|---|---|
| `npm view prisma@7 version` | höchste 7.x-Version: **7.10.1** |
| `npm view prisma dist-tags` | `latest` = **8.0.0-rc.29** (RC!), `prev` = 7.10.1. Ein `npm i prisma@latest` würde den RC von Prisma 8 ziehen, deshalb die Version **genau** festlegen. |
| `npm view prisma@7.10.1 engines` | Node `^20.19 \|\| ^22.12 \|\| >=24.0`; Peer TypeScript `>=5.4.0` |
| `npm view prisma engines` (8.0 RC) | Node `^22.18 \|\| ^24.11 \|\| >=26` |
| `npm view @prisma/config@7.10.1 dependencies` | `deepmerge-ts: 8.0.2` (Version mit Fix) |
| `npm ls deepmerge-ts @prisma/config prisma` | `prisma@6.19.3 → @prisma/config@6.19.3 → deepmerge-ts@7.1.5` |
| `npm audit --omit=dev --json` | 3× high: `deepmerge-ts` (<8.0.0), `@prisma/config` (via), `prisma` (via); fixAvailable: `prisma@7.10.1` (semver-major). Es handelt sich um **eine** Schwachstelle, die über die Kette dreimal gezählt wird. `prisma` erscheint trotz `--omit=dev`, weil `@prisma/client@6` `prisma` als optionalen Peer deklariert. |
| `node -v` (lokal) | v24.22.2 |
| Dockerfile | `FROM node:20-alpine` (Node 20 ist seit 2026-04 EOL) |

## 1. Breaking Changes in Prisma 7 (Quellen)

Hauptquelle: Upgrade-Guide https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
Weitere Quellen: Config-Referenz https://www.prisma.io/docs/orm/reference/prisma-config-reference, Release 7.10.1 https://github.com/prisma/prisma/releases/tag/7.10.1, Releases https://github.com/prisma/prisma/releases

| # | Änderung | Inhalt |
|---|---|---|
| B1 | Generator | `prisma-client-js` wird entfernt; Ersatz ist `provider = "prisma-client"`, der neue **Rust-freie** Client (TS-Quellcode plus WASM-Query-Compiler, keine `libquery_engine-*.so.node` mehr). |
| B2 | `output` Pflicht | Der Client wird nicht mehr nach `node_modules/.prisma` erzeugt. Import aus dem erzeugten Pfad, z. B. `@/generated/prisma/client`. |
| B3 | ESM | Prisma wird als ES-Modul ausgeliefert. Der Guide empfiehlt `"type": "module"` sowie `module: ESNext`, `moduleResolution: bundler` und `target: ES2023`. |
| B4 | `prisma.config.ts` | Schema-Pfad, Migrations-Pfad, Seed und `datasource.url` stehen standardmäßig hier (im Projektwurzelordner). |
| B5 | `url`/`directUrl`/`shadowDatabaseUrl` im `datasource`-Block | Veraltet; die Werte gehören in `prisma.config.ts`. |
| B6 | Driver Adapter Pflicht | Jeder `PrismaClient` braucht einen `adapter`; für Postgres `@prisma/adapter-pg` (nutzt `pg`). Die Konstruktoroptionen `datasources`/`datasourceUrl` entfallen. |
| B7 | Pool-/SSL-Verhalten | Pool-Defaults kommen von `pg` (z. B. kein Connect-Timeout, v6 hatte 5 s). `pg` prüft TLS-Zertifikate (sonst `P1010`). |
| B8 | `.env` nicht mehr automatisch geladen | Laden per `dotenv`, `node --env-file` oder über die Umgebung. |
| B9 | `env()` in `prisma.config.ts` | Wirft `PrismaConfigEnvError`, wenn die Variable fehlt, und zwar bei **jedem** CLI-Befehl, auch bei `prisma generate`. Die Doku empfiehlt für CI/Build `process.env.DATABASE_URL ?? ''`. |
| B10 | Entfernte APIs | `$use()`-Middleware (Ersatz: `$extends`), Preview-Feature Metrics |
| B11 | CLI | `migrate dev`/`db push` erzeugen den Client nicht mehr automatisch und seeden nicht mehr. Entfernt: `--skip-generate`, `--skip-seed`, `db execute --schema/--url` sowie bei `migrate diff` die Optionen `--from-url`, `--to-url`, `--*-schema-datasource` und `--shadow-database-url` (Ersatz: `--from-config-datasource`/`--to-config-datasource`). |
| B12 | Entfernte Env-Variablen | u. a. `PRISMA_CLIENT_ENGINE_TYPE`, `PRISMA_QUERY_ENGINE_LIBRARY`, `PRISMA_SKIP_POSTINSTALL_GENERATE`, `PRISMA_MIGRATE_SKIP_GENERATE` |
| B13 | Versionen | Node ≥ 20.19 (empfohlen 22), TypeScript ≥ 5.4 |
| B14 | Accelerate | Für amanah-app nicht relevant. |
| B15 | 7.10.1 | Abhängigkeiten mit Advisories aktualisiert („deepmerge-ts“ u. a.). Migrate verweigert mit `P3025` den Lauf, wenn die Shadow-DB-URL gleich der Haupt-DB-URL ist. |

## 2. Zuordnung zum Repo

| Datei | Ist-Zustand | Betroffen durch | Änderung |
|---|---|---|---|
| `prisma/schema.prisma` | `provider = "prisma-client-js"`, `url = env("DATABASE_URL")` | B1, B2, B5 | `provider = "prisma-client"`, `output = "../src/generated/prisma"`; `url` entfernen und nach `prisma.config.ts` verschieben. Die Modelle bleiben **unverändert**. |
| *(neu)* `prisma.config.ts` | fehlt | B4, B8, B9 | `defineConfig({ schema: "prisma/schema.prisma", migrations: { path: "prisma/migrations" }, datasource: { url: process.env.DATABASE_URL ?? "" } })`. Kein `env()`, weil sonst `prisma generate` im Docker-Build und in `postinstall` ohne DATABASE_URL abbricht. Kein `dotenv` (ist nicht installiert; die Werte kommen per Compose bzw. Shell). |
| `src/lib/server/prisma.ts` | `new PrismaClient({ log })` aus `@prisma/client` | B2, B6 | Import aus `@/generated/prisma/client`; `new PrismaPg({ connectionString: process.env.DATABASE_URL })` und `new PrismaClient({ adapter, log })`. Den Singleton beibehalten. Pool-Größe und Timeout bewusst setzen (B7), z. B. `connectionTimeoutMillis: 5000`. Lazy-Initialisierung empfohlen, siehe Tests. |
| `src/lib/server/repository/postgres-repository.ts` | `findUnique`, `create`, `upsert`, `deleteMany`, `$transaction([...])`, `$queryRaw\`SELECT 1\`` | – | Keine API-Änderung nötig; alles bleibt in v7 erhalten. Typen prüfen: `data: payload as object` gegen `Prisma.InputJsonValue`, eventuell auf `as Prisma.InputJsonValue` umstellen. Kein `$use` und keine Metrics im Code (geprüft per grep; `@prisma` wird nur in diesen beiden Dateien importiert). |
| `src/lib/server/db.ts` | nutzt nur `isDbConfigured()` | – | keine |
| `src/lib/server/repository/index.ts` | importiert `postgres-repository` **statisch** → `prisma.ts` wird bei jedem Import gebaut | B6 | Funktioniert mit dem Adapter weiter, weil der `pg`-Pool erst bei der ersten Query verbindet. Lazy-Getter trotzdem empfohlen, damit Memory-Modus und Unit-Tests keinen Adapter erzeugen. |
| `package.json` | `@prisma/client ^6.19.3`, `prisma ^6.19.3`, `postinstall: prisma generate`, `db:*` | B1, B11, B13 | `prisma`/`@prisma/client` = `7.10.1` (exakt bzw. `~7.10.1`, **nicht** `latest`), dazu `@prisma/adapter-pg@7.10.1` und `pg` als Dependency. `postinstall` funktioniert weiter (dank B9-Lösung). `db:migrate`/`db:push` danach um `&& prisma generate` ergänzen (B11). `"type": "module"` ist für Next/Vitest **wahrscheinlich nicht zwingend**, weil der Bundler ESM verarbeitet. Erst ohne testen; nur bei Fehlern setzen, denn das betrifft `scripts/*.mjs` nicht, aber `eslint.config.mjs`/`postcss.config.mjs` sind schon ESM. |
| `tsconfig.json` | `target ES2017`, `module esnext`, `moduleResolution bundler` | B3 | `module`/`moduleResolution` passen. `target` laut Guide `ES2023`; gegen die Build-Ausgabe prüfen (Next transpiliert selbst, `noEmit`). |
| `.gitignore` / `eslint.config.mjs` | — | B2 | `/src/generated/` ignorieren (nicht committen) und vom Lint ausnehmen. |
| `Dockerfile` | `node:20-alpine`; `npx prisma generate` in `migrate` und `builder`; Runner kopiert `node_modules/.prisma` und `node_modules/@prisma/client` | B1, B2, B13 | (a) **`COPY --from=builder /app/node_modules/.prisma` schlägt fehl**, weil das Verzeichnis nicht mehr existiert. Beide COPY-Zeilen entfernen bzw. ersetzen. (b) Der generierte Client liegt in `src/generated` und wird von Next/Turbopack **mitgebündelt**; `@prisma/client/runtime/*` und `pg` werden über die Standalone-Dateiverfolgung kopiert (`@prisma/client`, `prisma` und `pg` stehen in der Default-Liste `serverExternalPackages`, siehe `node_modules/next/dist/lib/server-external-packages.jsonc`). Den Inhalt von `.next/standalone/node_modules` nach dem Build prüfen (`@prisma/client/runtime/client*`, `query_compiler_bg.postgresql*`, `pg`, `@prisma/adapter-pg`). (c) Basis-Image auf `node:22-alpine` oder `node:24-alpine` (Node 20 ist EOL; Prisma 8 verlangt ≥ 22.18). `openssl` wird für Prisma danach nicht mehr gebraucht, schadet aber nicht. (d) Die Stage `migrate` braucht `prisma.config.ts` (durch `COPY . .` vorhanden; `.dockerignore` schließt sie nicht aus). In der `deps`-Stage läuft `postinstall` ohne Config und ohne `src/`; das ist unkritisch, weil `builder` erneut generiert. |
| `.dockerignore` | `*.sql` | – | Matcht in `.dockerignore` nur auf Wurzelebene; `prisma/migrations/**/migration.sql` gelangt also in den Kontext. Unverändert lassen, aber im Test die Migration in `migrate` verifizieren. |
| `docker-compose.prod.yml` | `migrate`-Service (Target `migrate`, `prisma migrate deploy`) mit `DATABASE_URL` aus der Env; `app` mit `DATABASE_URL` | B4, B7, B8 | Keine strukturelle Änderung; `DATABASE_URL` kommt aus der Umgebung und `prisma.config.ts` liest `process.env`. **TLS:** Postgres läuft im internen Netz ohne SSL; enthält die URL kein `sslmode=require`, entsteht kein Zertifikatsproblem. Prüfen. |
| `docker-compose.local.yml` | Postgres 16 auf Port 5436 | – | keine; dient als Wegwerf-DB für Tests (eigenes Volume bzw. eigener Projektname). |
| `scripts/*.sh` | `backup-postgres.sh`/`restore-postgres.sh` nutzen `pg_dump`/`psql` im Container; `deploy-preflight.sh` prüft `prisma/schema.prisma` | – | keine Prisma-CLI-Abhängigkeit. Optional prüft `deploy-preflight.sh` zusätzlich `prisma.config.ts`; `release-check.mjs` ebenso. |
| `src/__tests__/postgres.test.ts` | Integrationstest nur bei `DATABASE_URL` + `AMANAH_SERVER_STORAGE=postgres`; Vitest-Env `jsdom` | B6 | Läuft vermutlich unverändert. Der Client muss vorher generiert sein. Mit `pg` unter `jsdom`: Node-APIs sind vorhanden; falls nötig `// @vitest-environment node` in der Datei setzen. |

### Next.js 16 / Turbopack / Standalone
- Bisher wird der Rust-Query-Engine (`libquery_engine-debian-openssl-3.0.x.so.node`, für Alpine musl) über die manuellen COPY-Zeilen ins Image gebracht. Mit v7 entfällt das native Binary, und damit fällt auch die häufigste Fehlerquelle bei Standalone-Builds (fehlendes Engine-Binary, falsches `binaryTargets`) weg.
- Der generierte Client ist App-Quellcode und wird gebündelt. Der WASM-Query-Compiler wird aus `@prisma/client/runtime` geladen (laut `ls node_modules/@prisma/client/runtime` gibt es `query_compiler_bg.postgresql.wasm-base64.*`, also als Base64 eingebettet und ohne separate `.wasm`-Datei, die verfolgt werden müsste).
- Risiko: Turbopack-Bündelung von `pg` (optionales `pg-native`). `pg` steht in der Default-Liste der External-Packages und wird deshalb nicht gebündelt, sondern verfolgt. Nach dem Build `node .next/standalone/server.js` gegen die lokale DB starten und `/api/health` sowie Login prüfen.
- Vor der Umsetzung `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md` lesen (Repo-Regel: Next-Doku prüfen). Wahrscheinlich ist keine Änderung an `next.config.ts` nötig.

## 3. Datenmigration

- **Migrationshistorie:** Prisma 7 ändert weder das Format von `prisma/migrations/*/migration.sql` noch `migration_lock.toml` (`provider = "postgresql"`) noch die Tabelle `_prisma_migrations`. Der Upgrade-Guide nennt keinen Migrationsschritt für die Historie; Breaking Changes betreffen nur Client, CLI und Config.
- **Neue Migration nötig?** Nein, solange das Schema (Modelle) unverändert bleibt. Generator- und Datasource-Änderungen erzeugen kein DDL. Erwartet: `migrate diff` ergibt **leer**.
- **Datenrisiko:** gering. `Json`-Spalte (`jsonb`), `DateTime` (`timestamp(3)`), `cuid()` (clientseitig erzeugt), Cascade-FKs: alles unverändert. Mögliche Unterschiede liegen nur zur Laufzeit im Mapping des Driver Adapters (DateTime/Timezone, Json-Serialisierung). Der Integrationstest sollte deshalb ein Roundtrip von `AmanahData.data` (verschachteltes JSON, Unicode/Arabisch, Datumsstrings) und `expiresAt` vergleichen.
- **Empfohlene Verifikation (nur auf Wegwerf-DB bzw. Restore-Kopie, nie gegen Produktion):**
  1. Wegwerf-Postgres 16 starten (eigener Containername/Volume, nicht `amanah_pg_data` wiederverwenden).
  2. Mit **Prisma 6** `prisma migrate deploy` ausführen und Testdaten anlegen (Integrationstest bzw. API-E2E).
  3. Auf Prisma 7 wechseln. `prisma migrate status` muss „Database schema is up to date“ melden.
  4. `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`: Exit 0 bedeutet keine Differenz. Zusätzlich `--from-migrations prisma/migrations --to-schema prisma/schema.prisma` mit Shadow-DB (Shadow-URL ≠ DB-URL, sonst `P3025`). Flag-Namen vorher mit `npx prisma migrate diff --help` (v7) gegenprüfen.
  5. Backup/Restore-Probe: Dump einer Kopie mit `scripts/backup-postgres.sh` (gegen eine Test-Instanz per `ENV_FILE`/`POSTGRES_CONTAINER`), Restore in eine frische Wegwerf-DB, danach v7-App starten und Login sowie Laden der Daten prüfen.
  6. Vor einem späteren Produktivrollout (eigene Owner-Freigabe nötig) ein frisches Backup ziehen.

## 4. Schrittplan, Aufwand, Rollback, Tests

### Schrittplan (auf eigenem Branch, z. B. `chore/prisma-7`)
| # | Schritt | Aufwand (h) |
|---|---|---|
| 1 | Next-Doku (`serverExternalPackages`, Standalone) und Prisma-7-Guide lesen; Branch anlegen | 0,5 |
| 2 | Abhängigkeiten: `prisma@7.10.1`, `@prisma/client@7.10.1`, `@prisma/adapter-pg@7.10.1`, `pg` (exakte Versionen); `npm audit` erneut | 0,5 |
| 3 | `schema.prisma` (Generator/Output, `url` entfernen), `prisma.config.ts` neu, `.gitignore`/ESLint-Ignore für `src/generated` | 0,5 |
| 4 | `prisma.ts` auf Adapter und Lazy-Singleton umbauen; Typen in `postgres-repository.ts` prüfen; `tsc --noEmit`/Lint | 1–1,5 |
| 5 | `package.json`-Skripte (`db:migrate`/`db:push` + `generate`) | 0,25 |
| 6 | Dockerfile: Runner-COPY-Zeilen, Base-Image Node 22/24, Standalone-Trace prüfen | 1–2 |
| 7 | Tests: Unit, Postgres-Integration mit Wegwerf-DB, Migrationsverifikation (Abschnitt 3) | 2–3 |
| 8 | Docker-Build (`migrate` + `app`) lokal mit Wegwerf-DB, Health/Login/Speichern, E2E im API-Modus | 1,5–2 |
| 9 | Puffer für Turbopack/ESM/Typ-Überraschungen; Doku/README/Handoff | 1–2 |
| | **Summe** | **ca. 8–12 h** (realistisch 1,5 Personentage) |

### Rollback
- Code: Branch nicht mergen bzw. Merge-Commit zurücknehmen (`git revert`, nicht destruktiv). Die Änderung beschränkt sich auf ca. 8 Dateien.
- Datenbank: Weil keine neue Migration entsteht, ist kein DB-Rollback nötig. Prisma 6 und 7 teilen sich dieselbe `_prisma_migrations`-Tabelle und dasselbe Schema.
- Deployment (nur nach Owner-Freigabe): vorheriges Image-Tag behalten und bei Fehlern zurückschalten; vor dem Rollout ein Backup mit `scripts/backup-postgres.sh`.

### Testplan
1. **Unit:** `npm run lint`, `npx tsc --noEmit`, `npm test` (Vitest; Postgres-Test wird ohne DB übersprungen).
2. **Postgres-Integration (Wegwerf-Container):** z. B. `docker run --rm -d --name amanah-pg-p7test -e POSTGRES_PASSWORD=… -p 5440:5432 postgres:16-alpine`, dann `DATABASE_URL=postgresql://…@localhost:5440/… npx prisma migrate deploy`, danach `AMANAH_SERVER_STORAGE=postgres DATABASE_URL=… npx vitest run src/__tests__/postgres.test.ts`. Den Test um Folgendes ergänzen: JSON-Roundtrip-Vergleich (`toEqual`), abgelaufene Session wird gelöscht, `deleteUser`-Transaktion samt Cascade, `checkConnection()`. Container danach stoppen.
3. **Migrationsverifikation:** siehe Abschnitt 3, Schritte 2 bis 4 (v6-Daten mit v7 lesen).
4. **Build/Standalone:** `npm run build`, dann `node .next/standalone/server.js` mit Postgres-Env; `/api/health` muss 200 liefern.
5. **E2E im API-Modus:** Playwright gegen den Standalone-Server bzw. Docker-Stack mit `NEXT_PUBLIC_AUTH_MODE=api`, `NEXT_PUBLIC_STORAGE_MODE=api`, `AMANAH_SERVER_STORAGE=postgres` (Registrierung, Login, Daten speichern, Reload, Logout, Account löschen). Die Konfiguration in `playwright.config.ts` vorher prüfen; `build:e2e` nutzt den lokalen Modus.
6. **Docker:** `docker compose -f docker-compose.prod.yml build` nur lokal mit Test-Env-Datei; `migrate`-Container muss mit 0 enden, App muss healthy sein. **Kein Deployment** (Sperre laut `AI_HANDOFF.md` §8).

## 5. Alternative: Prisma 6 behalten. Ausnutzbarkeit der Advisories

- **Advisory:** GHSA-ggr8-5vv4-36mx / CVE-2026-40345 (https://github.com/advisories/GHSA-ggr8-5vv4-36mx), `deepmerge-ts` < 8.0.0, CWE-674, CVSS 4.0 8,2, nur Verfügbarkeit. Ursache: Endlosrekursion in `deepmerge()`/`deepmergeInto()`/`deepmergeCustom` bei **zyklischen bzw. selbstreferenzierenden Objektgraphen**. Laut Advisory löst reines JSON die Lücke **nicht** aus. Die Einträge für `@prisma/config` und `prisma` sind nur transitive Folgen derselben Lücke.
- **Wo wird deepmerge-ts genutzt?** Nur in `node_modules/@prisma/config/dist/index.js` (`loadConfigTsOrJs` → `c12`-`merger`), also beim Laden von `prisma.config.*` durch die **CLI**. Eingabe ist die eigene Config-Datei des Entwicklers (im Repo existiert keine), keine Benutzerdaten.
- **Laufzeit:** Der generierte Client nutzt `@prisma/client/runtime/library` (`node_modules/.prisma/client/index.js`); `library.js` enthält kein deepmerge. `.next/standalone/node_modules` enthält nur `@prisma/client`, kein `@prisma/config` und kein `deepmerge-ts`. Der App-Container ist damit **nicht betroffen**.
- **CLI-Kontexte:** Dev-Rechner, Docker-Build (`prisma generate`) und `migrate`-Container (`prisma migrate deploy`, kurzlebig, keine Netzwerkeingaben). Ein Angreifer bräuchte Schreibzugriff auf die Config-Datei und hätte dann ohnehin Codeausführung.
- **Bewertung:** Für amanah-app ist die Lücke **praktisch nicht ausnutzbar** (kein Netzwerkpfad, keine Angreiferdaten, kein Laufzeitcode). Das Rating „high“ ist ein Artefakt des generischen CVSS-Werts.
- **Wenn Prisma 6 bleibt:** Die Audit-Meldung dokumentiert akzeptieren (Risk-Acceptance in `SECURITY.md`/Release-Check). Optional `"overrides": { "deepmerge-ts": "^8.0.2" }`: Das ist ein semver-major-Override eines transitiven Pakets, dessen Kompatibilität mit `@prisma/config@6.19.3` ungetestet ist; nur mit `prisma generate`/`migrate`-Test. Ob Prisma noch einen 6.19.x-Patch liefert, ist offen (`npm view prisma@6 version` → höchste 6.19.3). Prisma 6 ist ausgelaufen; Prisma 8 steht als RC bereit, d. h. die technische Schuld wächst.

## 6. Empfehlung

1. **Kurzfristig:** Kein Notfall-Upgrade nötig. Das Advisory betrifft nur die CLI bzw. Build-Zeit, für diese App ist es nicht ausnutzbar. Risk-Acceptance dokumentieren, um Release-Gates (`npm audit`) nicht zu blockieren.
2. **Mittelfristig (empfohlen, in einem separaten Branch, nicht in `feat/vorsorge-testament-foundation`):** Auf **Prisma 7.10.1 (exakt gepinnt, nicht `latest` = 8.0 RC)** migrieren und gleichzeitig das Docker-Base-Image von Node 20 (EOL) auf 22 oder 24 LTS heben. Aufwand ca. 8–12 h. Das Datenrisiko ist gering, weil keine neue Migration und kein Formatwechsel nötig ist. Der Hauptaufwand liegt in Dockerfile/Standalone und Tests. Nebeneffekt: Das native Engine-Binary fällt weg, die Images werden einfacher.
3. Commits, Merge und Deployment nur nach ausdrücklicher Owner-Freigabe (`AI_HANDOFF.md` §8).
