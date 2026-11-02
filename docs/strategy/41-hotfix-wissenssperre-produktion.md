# Hotfix-Vorbereitung: Wissenssperre für die Produktion (Stand 02.11.2026)

**Für:** Owner (Entscheidung), Betrieb (Umsetzung). **Nichts davon ist deployt oder gemerged.**

## 1. Befund (nur lesend, 02.11.2026)

| Prüfung | Ergebnis |
|---|---|
| Laufender Stand | `/opt/amanah-app` auf `7d0859b` vom 17.07.2026, Container `amanah-app` seit 17.07. Enthält keine Commits des Feature-Branches |
| Inhalt am Container (`127.0.0.1:3001`) | Ungeprüfte Texte werden ausgeliefert: `/janazah-kompass`, `/barzakh`, `/sadaqa-jariya`, `/testament-erbe`, `/islam-oder-kultur`, `/patientenverfuegung` (je „Geprüft“ oder Hadith), `/wissen/<thema>` (HTTP 200), `/api/knowledge/entries` (12 als `reviewed`), Einzelabruf und Suche |
| JavaScript | Hadith- und Entwurfstexte in den ausgelieferten Dateien |
| DNS | `amanahordner.de` und `www`: `NXDOMAIN` bei 1.1.1.1 und 8.8.8.8 |
| Proxy | Caddy leitet `amanahordner.de` an die App. HTTP antwortet mit 308 auf HTTPS; HTTPS scheitert am TLS-Handshake, offenbar fehlt das Zertifikat |
| Port | `3001` von außen nicht erreichbar (Zeitüberschreitung) |
| Andere Routen | Im Caddyfile keine weitere Route zur App |

**Einschätzung:** Die Produktions-App liefert die Texte aus, ist aber nach diesen Prüfungen derzeit **nicht aus dem Internet erreichbar**. Geprüft von einem Rechner aus; Zugang besteht für Personen mit Serverzugang oder über das interne Docker-Netz, das auch `gemeinsam1` nutzt ([Doku 29](29-staging-absicherung-und-pilot.md) §6).

**Das Risiko entsteht in dem Moment, in dem `amanahordner.de` registriert wird:** Der Proxy ist bereits eingerichtet, die Inhalte wären dann ohne weiteren Schritt öffentlich.

**Empfehlung:** Hotfix nicht als Notfall, aber **zwingend vor jeder Domain-Registrierung oder -Schaltung** einspielen. Bessere Alternative: die Route vorher entfernen.

## 2. Hotfix

Datei: [`hotfix/2026-11-02-wissen-sperre-auf-7d0859b.patch`](hotfix/2026-11-02-wissen-sperre-auf-7d0859b.patch), Basis `7d0859b`. Keine Migration, keine neue Abhängigkeit, keine Änderung an Konfiguration.

| Datei | Änderung |
|---|---|
| `src/components/knowledge/content-in-review.tsx` | neu: Hinweis ohne Wissensdaten |
| `src/app/{janazah-kompass,barzakh,sadaqa-jariya,testament-erbe,islam-oder-kultur,patientenverfuegung}/page.tsx`, `src/app/wissen/page.tsx` | zeigen nur den Hinweis, `noindex` |
| `src/app/wissen/[slug]/page.tsx` | immer 404 |
| `src/app/api/knowledge/entries/route.ts`, `entries/[id]/route.ts`, `search/route.ts` | immer 404 |
| `src/app/api/ai/route.ts`, `src/app/api/ai/knowledge/route.ts` | immer 503 |
| `src/components/marketing/akhira-section.tsx` | Hadith entfernt |
| `src/lib/ai/rule-based-extract.ts` (neu), `rule-based-ai-provider.ts`, `src/lib/guided-flow/answer-parser.ts` | Gesprächsablauf ohne Wissensdaten im Browser |
| `src/app/akuter-todesfall/page.tsx` | zwei Schritte neutral formuliert |

Der Hotfix ist bewusst gröber als der Feature-Branch: Dieser bringt 22+ Commits, Migrationen und Plus-Funktionen mit und ist **nicht** Teil dieses Hotfixes.

## 3. Testnachweis (lokal auf Export von `7d0859b`)

- Build Exit 0 mit `NEXT_PUBLIC_AUTH_MODE=api`.
- Textproben aus allen Wissensdateien des Stands: **0 Treffer** in `.next/static` (36 Dateien) sowie auf den genannten Seiten und APIs. „Geprüft“ und „Sahih“: 0.
- `/wissen/<thema>`, Knowledge-APIs: 404. `/api/ai`, `/api/ai/knowledge`: 503.
- Vitest: 207 bestanden, 10 fehlgeschlagen. Alle 10 erwarten die entfernten Inhalte (`ai`, `branding`, `content-sources`, `knowledge`, `ux-corrections`). Beim Einspielen anpassen; das Patch ändert keine Tests.
- **NOT_RUN:** Browser-Durchlauf von Anmeldung und Ordner auf diesem Stand, Docker-Image-Build, Staging, Produktion.

## 4. Risiko

| Risiko | Einschätzung |
|---|---|
| Daten | keines erkennbar: keine Migration, keine Schreibzugriffe berührt |
| Nutzer | Wissensseiten zeigen nur noch den Hinweis; Links darauf bleiben gültig, `/wissen/<thema>` wird 404. KI-Assistent antwortet nicht mehr auf Wissensfragen |
| Anmeldung, Ordner | Code nicht geändert, außer `answer-parser` (gleiche Logik, anderer Dateiort). Browser-Test steht aus |
| Betrieb | Neustart der App nötig, kurzer Ausfall |
| Unvollständigkeit | Module hinter der Anmeldung nicht bereinigt |

## 5. Einspielen (nur nach gesonderter Owner-Freigabe)

1. Staging-Test mit synthetischen Daten.
2. Image sichern: `docker tag amanah-app-app:latest amanah-app-app:vor-wissenssperre`. Tag des tatsächlichen Images vorher mit `docker ps` prüfen.
3. Backup der Produktionsdatenbank nach Betriebsanleitung; nicht wegen des Patches, sondern als Vorsicht.
4. Patch auf `7d0859b` anwenden, Tests anpassen, Image bauen, App neu erstellen. Datenbank-Container nicht anfassen.
5. Prüfen: `curl` auf die Pfade aus §3 am Server.

## 6. Rollback

1. Patch zurücknehmen oder Image verwenden: `docker tag amanah-app-app:vor-wissenssperre amanah-app-app:latest`.
2. Nur die App neu erstellen, im Compose-Aufruf wie zuvor. Datenbank und Volumes bleiben unberührt.
3. Health prüfen. Da keine Migration enthalten ist, ist kein Datenbank-Rollback nötig.

**Achtung:** Ein Rollback macht die ungeprüften Texte in der App wieder abrufbar. Vorher sicherstellen, dass keine öffentliche Domain auf die App zeigt.
