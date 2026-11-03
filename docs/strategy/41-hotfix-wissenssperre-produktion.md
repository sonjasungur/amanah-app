# Produktionsschutz: Route und Wissens-Hotfix (Stand 02.11.2026)

**Für:** Owner (Entscheidung), Betrieb (Umsetzung).

**Stand:** Stufe 1 (02.11.2026, 15:08 Uhr) und Stufe 2 (02.11.2026, 15:25 Uhr) sind nach Owner-Freigabe ausgeführt. Die Route ist geschlossen, der Hotfix läuft. Deployment-Stand: §5. Die Absicherung ist am 02.11.2026 um 16:55 Uhr nach Owner-Freigabe installiert: §6.

## 1. Befund vor Stufe 1

**Korrektur:** Eine frühere Fassung dieses Dokuments nannte die App „nicht aus dem Internet erreichbar“. Das war falsch, weil der Weg über den Host-Kopf nicht getestet war.

Die Produktions-App (`/opt/amanah-app`, `7d0859b` vom 17.07.2026) liefert ungeprüfte religiöse und rechtliche Texte aus und ist **von außen erreichbar**, sobald ein Client es gezielt versucht:

| Weg | Ergebnis von außen |
|---|---|
| `https://amanahordner.de` | nicht möglich: `NXDOMAIN` (1.1.1.1, 8.8.8.8), kein Zertifikat |
| Port 3001 | nicht möglich: nur `127.0.0.1` |
| **TLS zu `gemeinsam1.com` mit HTTP-Kopf `Host: amanahordner.de`** | **offen:** `/patientenverfuegung`, `/api/knowledge/entries`, `/wissen/ghusl-kafan`, `/login`, `/register` antworten mit 200 |
| Derselbe Weg mit `www.amanahordner.de` | 301 auf `amanahordner.de` |
| Andere Host-Köpfe | 200 ohne Inhalt, keine App |
| SSH-Tunnel | Für Personen mit Serverzugang |
| Docker-Netz `gemeinsam1-prod_internal` | Die Container von `gemeinsam1` erreichen `amanah-app:3000` ([Doku 29](29-staging-absicherung-und-pilot.md) §6); keine öffentliche Route |

**Tragweite:**

- Über denselben Weg ist auch die Registrierung des Juli-Stands offen, dort ohne E-Mail-Bestätigung. Es wurde nichts abgesendet.
- Normale Browser kommen so nicht ohne Weiteres hinein, und Suchmaschinen dürften es kaum finden.
- Ob jemand den Weg genutzt hat, ist **nicht belegt:** Das Caddy-Log enthält keine Einträge zu diesem Host. Nach Owner-Freigabe gezählt: 0 Konten (Nur-Lese-Transaktion, Rolle `pg_read_all_data`, nur Aggregat); das Juli-Schema hat keine Spalte für Verifizierung.
- Sobald `amanahordner.de` registriert wäre, wäre die App ohne weiteren Schritt normal öffentlich. Auch Dritte könnten die Domain registrieren und auf den Server zeigen lassen.

## 2. Stufe 1: alte Route abschalten

**Ursache:** Die Datei `/opt/gemeinsam1/deploy/Caddyfile` auf dem Host wurde am 05.07. ersetzt (anderer Inode). Der Container sieht weiter die ältere Datei, und Caddy wurde seit dem 03.07. nicht neu gestartet.

| Vergleich | Ergebnis |
|---|---|
| Host-Datei (`sha256` beginnt mit `3245e0f90761`) gegen Container-Sicht | **Einziger Unterschied:** die 22 Amanah-Zeilen |
| Hosts Container-Sicht | `amanahordner.de`, `www.amanahordner.de`, `gemeinsam1.com`, `www.gemeinsam1.com`, `api.gemeinsam1.com` |
| Hosts Host-Datei | `gemeinsam1.com`, `www.gemeinsam1.com`, `api.gemeinsam1.com` |
| `caddy adapt --validate` mit der Host-Datei im laufenden Container | erfolgreich |

Die Host-Datei ist also bereits der Zielzustand. **Es wird keine Datei geändert**, kein Container neu gestartet und kein Netz angefasst.

**Umsetzung (nur nach Freigabe, auf dem Server):**

```bash
sha256sum /opt/gemeinsam1/deploy/Caddyfile   # muss mit 3245e0f90761 beginnen, sonst abbrechen
docker exec -i gemeinsam1-prod-caddy caddy adapt --config /dev/stdin --adapter caddyfile --validate \
  < /opt/gemeinsam1/deploy/Caddyfile > /dev/null
docker exec -i gemeinsam1-prod-caddy caddy reload --config /dev/stdin --adapter caddyfile \
  < /opt/gemeinsam1/deploy/Caddyfile
```

**Prüfung danach (von außen):**

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' https://gemeinsam1.com/                # 200, Inhalt
curl -s -o /dev/null -w '%{http_code}\n' https://api.gemeinsam1.com/                             # unverändert zu vorher
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' -H 'Host: amanahordner.de' https://gemeinsam1.com/patientenverfuegung  # 200 und 0 Bytes
```

Vor dem Reload den Status von `api.gemeinsam1.com` notieren, damit „unverändert“ prüfbar ist.

**Ergebnis 02.11.2026, 15:08 Uhr:** Live-Konfiguration ohne Amanah; Amanah-Host auf allen geprüften Pfaden 200 mit 0 Bytes; `gemeinsam1.com`, `www` und `api` byte-genau wie vorher; keine Fehler im Caddy-Log; kein Neustart.

**Fehlerfall (Owner-Vorgabe):** Die Route wird nicht automatisch wieder geöffnet. Schlägt etwas fehl, zuerst die Host-Datei erneut laden. Ein Neustart von Caddy lädt ebenfalls die Host-Datei und bleibt sicher. Der folgende Befehl stellt die alte Route wieder her und ist **nur auf ausdrückliche Owner-Entscheidung** zu verwenden:

```bash
docker exec gemeinsam1-prod-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Das funktioniert nur, solange der Container nicht neu gestartet wurde.

**Bleibt zu beachten:** Die Host-Datei darf die Amanah-Zeilen nicht wieder erhalten, bevor die App geprüfte Inhalte liefert. Der Container sieht bis zum nächsten Neustart weiter die alte Datei; das ist ohne Reload dieser Datei wirkungslos.

**Auswirkung auf `gemeinsam1` und andere:**

- Die Konfiguration von `gemeinsam1` ist vorher und nachher zeilengleich; Zertifikate bleiben.
- `caddy reload` ersetzt die Konfiguration ohne Neustart des Prozesses.
- Probelauf mit demselben Image (`caddy:2.11.4-alpine`) und nachgebauter Konfiguration: 300 von 300 Abrufen der anderen Domain ohne Fehler, durch Abschalten und Rückbau hindurch; danach `amanahordner.de` mit 200 und 0 Bytes.
- `amanah-staging` hat keine Route im Proxy, Staging ist nicht betroffen.
- **Grenzen:** Der Probelauf nutzte nicht das echte Caddyfile, und die Admin-Schnittstelle der Produktion wurde nur als Voreinstellung erkannt, nicht geschaltet. Schlägt der Reload fehl, bleibt die alte Konfiguration aktiv.
- Die App läuft weiter auf `127.0.0.1:3001`. Die Netztrennung aus Doku 29 §6 ist nicht Teil dieser Stufe.

## 3. Stufe 2: Wissens-Hotfix

Datei: [`hotfix/2026-11-02-wissen-sperre-auf-7d0859b.patch`](hotfix/2026-11-02-wissen-sperre-auf-7d0859b.patch), Basis `7d0859b`, 19 Produktdateien und 5 Testdateien. Keine Migration, keine neue Abhängigkeit, keine Konfigurationsänderung.

| Datei | Änderung |
|---|---|
| `src/components/knowledge/content-in-review.tsx` | neu: Hinweis ohne Wissensdaten |
| `src/app/{janazah-kompass,barzakh,sadaqa-jariya,testament-erbe,islam-oder-kultur,patientenverfuegung}/page.tsx`, `src/app/wissen/page.tsx` | zeigen nur den Hinweis, `noindex` |
| `src/app/wissen/[slug]/page.tsx` | immer 404 |
| `src/app/api/knowledge/entries/route.ts`, `entries/[id]/route.ts`, `search/route.ts` | immer 404 |
| `src/app/api/ai/route.ts`, `src/app/api/ai/knowledge/route.ts` | immer 503 |
| `src/components/marketing/akhira-section.tsx` | Hadith entfernt, Kacheln verweisen auf vorhandene Seiten |
| `src/lib/ai/rule-based-extract.ts` (neu), `rule-based-ai-provider.ts`, `src/lib/guided-flow/answer-parser.ts` | Gesprächsablauf ohne Wissensdaten im Browser |
| `src/app/akuter-todesfall/page.tsx` | zwei Schritte neutral formuliert |
| Tests `ai`, `branding`, `content-sources`, `knowledge`, `ux-corrections` | prüfen die Sperre statt der alten Inhalte |

Der Hotfix ist bewusst gröber als der Feature-Branch; dieser bringt Migrationen und Plus-Funktionen mit und gehört nicht dazu.

### Testnachweis (isoliert, synthetische Daten)

Docker-Build beider Stände (`--target runner`), eigene Testdatenbank und eigenes Netz, Konfiguration wie Produktion mit `AMANAH_AI_ENABLED=true`, Provider `rules`, kein externer KI-Aufruf.

| Prüfung (142 Textproben aus den Wissensdateien, 39 URLs) | Alter Stand | Hotfix |
|---|---|---|
| Docker-Build | Exit 0 | Exit 0 |
| JavaScript aus dem Image | 100 Treffer | **0** |
| Seiten und APIs mit Inhalten, „Geprüft“ oder „Sahih“ | 23 | **0** |
| Direkte Entwurfs-URLs `/wissen/<thema>` | 200 | **404** |
| `/api/knowledge/*` | 200 | **404** |
| `POST /api/ai`, `/api/ai/knowledge` | 200 | **503** |
| Vitest | nicht ausgeführt | 216 bestanden, 1 übersprungen |

**Browser auf dem Hotfix (Desktop- und Mobilprofil):** Anmeldung, Notfallkarte speichern und neu laden, Wert im Konto, Dashboard, Module, Check und Kacheln funktionieren.

**Rollback geprobt, gleiche Datenbank:** Hotfix → alter Stand → Hotfix. Der Ordner blieb erhalten, die Inhalte kamen zurück und verschwanden wieder. Container-Wechsel rund 1 Sekunde bis Health 200.

**Bestehender Fehler, nicht vom Hotfix:** React-Hydrationsmeldung #418 auf `/dashboard/*` und `/check`, in beiden Ständen identisch.

**Test auf dem Staging-Server (02.11.2026):** Eigene Instanz neben dem bestehenden Staging, eigene Wegwerf-Datenbank im RAM, eigenes internes Netz, nur lokal erreichbar, Speicher und CPU begrenzt, danach vollständig entfernt. Vergleichsstand war das unveränderte Produktions-Image. Ergebnisse wie oben: alter Stand 23 URLs mit Inhalten, Hotfix 0; JavaScript 0 Treffer; APIs 404; KI 503. Bestandsdaten aus dem alten Stand sind nach dem Wechsel lesbar; Anmeldung, Speichern, Neuladen und Vorsorge-Check bestehen auf Desktop- und Mobilprofil. Rollback und erneuter Hotfix mit derselben Datenbank bestehen.

**NOT_RUN:** echte Produktionskonfiguration (`.env.production` nicht gelesen), Echtgeräte, Bau des Images auf dem Server selbst.

### Risiko

| Risiko | Einschätzung |
|---|---|
| Daten | keines erkennbar: keine Migration; Rollback mit derselben Datenbank geprobt |
| Nutzer | Wissensseiten zeigen nur den Hinweis; `/wissen/<thema>` wird 404; KI-Assistent beantwortet keine Wissensfragen |
| Ausfall | kurz beim Containerwechsel; `gemeinsam1` nicht betroffen |
| Unvollständig | Module hinter der Anmeldung nicht bereinigt; offene Registrierung bleibt |

### Rollback

```bash
cd /opt/amanah-app
docker tag amanah-app-app:vor-wissenssperre amanah-app-app:latest
docker compose -f docker-compose.prod.yml -f docker-compose.prod.nocaddy.yml --env-file .env.production up -d --no-deps --no-build app
```

Datenbank und Volumes bleiben unberührt, die Route bleibt geschlossen. Ein Rollback macht die ungeprüften Texte in der App wieder abrufbar, intern über Docker-Netz und SSH.

## 4. Die beiden Datenverlust-Korrekturen

**Empfehlung: nicht in diesen Hotfix, sondern getrennt.**

- Beide Fehler stecken auch in `7d0859b`: `getSession` löscht die Sitzung bei jedem Fehler, und `syncStoreWithRemoteAfterAuth` überschreibt Eingaben während des Ladens.
- Der Hotfix berührt keine Anmelde- oder Schreiblogik und lässt sich deshalb risikoarm zurücknehmen. Die Korrekturen ändern genau diese Logik.
- Der Juli-Stand hält die Sitzung noch anders (Token im Browser), die Korrekturen sind dort nicht unverändert übertragbar und bräuchten eigene Tests.
- Mit Stufe 1 sind öffentliche Eingaben nicht mehr möglich, und die Produktion hat 0 Konten. Es besteht keine Dringlichkeit.
- **Owner-Entscheidung 02.11.2026:** ausrollen mit dem nächsten regulären Release vom Feature-Branch, nicht als Rückportierung.

## 5. Deployment-Stand (02.11.2026, 15:25 Uhr)

| Punkt | Wert |
|---|---|
| Quellstand | `7d0859b` plus Patch `hotfix/2026-11-02-wissen-sperre-auf-7d0859b.patch` (`sha256` beginnt mit `dda903c204002258`) |
| Image-Tags auf dem Server | `amanah-app-app:wissenssperre-dda903c`, `amanah-app-app:latest` |
| Image-ID auf dem Server | `sha256:f7f29e2ac4ef5db126d3e280f0dc4c01b6108a713d51474fad151684e1858d75` |
| Image-ID lokal beim Bau | `sha256:f30626cb3b064f413a358923ffec0bfcc7ff53967a84b2f817755d1dc3f8a23c`. Die Abweichung kommt vom anderen Image-Speicher des Servers |
| Gleicher Inhalt belegt durch | Archiv `sha256:4b049f99c5b6878702f4ed1ed9b05f4ca5a3c51aca1f0a68a6040afa2a140d33` auf beiden Seiten; Hash der Dateisystem-Schichten `d16c1d90fc93cb8c` auf beiden Seiten |
| Rollback-Image | `amanah-app-app:vor-wissenssperre`, `sha256:ec6e55a2bda27dc4e5bbab0031bea3e5df24044fba6bb20a347b7a3037dd4f8e` |
| Build-Werte | `NEXT_PUBLIC_AUTH_MODE=api`, `NEXT_PUBLIC_STORAGE_MODE=api`, `NEXT_PUBLIC_SITE_URL` und `NEXT_PUBLIC_APP_URL` wie zuvor im Container |
| Austausch | nur Container `amanah-app`, `--no-deps --no-build`; keine Migration, keine Änderung an Caddy oder `gemeinsam1` |

**Nachprüfung am Container (ohne Schreibzugriff):** Health 200; 142 Textproben: 0 Treffer in 37 Dateien; 39 URLs: 0 mit ungeprüften Inhalten, 27 mit 404; `/api/ai` und `/api/ai/knowledge` 503; Dashboard verlangt Anmeldung; falsches Passwort und Speichern ohne Anmeldung 401; Vorsorge-Check bleibt nach Neuladen. Konten weiter 0, Schema unverändert (1 Migration, 4 Tabellen). `gemeinsam1` byte-gleich, Amanah-Host 0 Bytes.

**Anmeldung, Dashboard und Speichern mit Konto** sind nicht am Produktionscontainer geprüft, weil dafür ein Konto angelegt werden müsste und die Produktion keines hat. Sie sind mit demselben Image gegen eine Wegwerf-Datenbank auf demselben Server bestanden.

**Wichtig für künftige Arbeiten:**

- `/opt/amanah-app` steht weiter sauber auf `7d0859b`, **ohne** das Patch. `docker compose up --build` ohne Patch würde die ungeprüften Inhalte zurückbringen. Nächster Bau nur mit Patch oder aus einem geprüften Release.
- `amanah-app-app:latest` zeigt auf den Hotfix. Beide Tags und das Rollback-Image nicht entfernen, solange kein neues Release läuft.
- Die Registrierung im Juli-Stand ist technisch weiter aktiv und ohne E-Mail-Bestätigung, aber von außen nicht erreichbar. Die Route darf erst nach einem Release wieder geöffnet werden.

## 6. Absicherung des Hotfixes (installiert 02.11.2026, 16:55 Uhr)

| Schutz | Umsetzung | Wirkung |
|---|---|---|
| Unveränderliche Referenz | [`deploy/production/docker-compose.pinned.yml`](../../deploy/production/docker-compose.pinned.yml), auf dem Server `/opt/amanah-prod/`, Image per Digest | `latest` spielt keine Rolle mehr |
| Kein Build möglich | kein `build`-Abschnitt, `pull_policy: never` | `--build` baut nichts |
| Alter Ordner startet nicht mehr | `/opt/amanah-app/.env.production` enthält nur noch `POSTGRES_USER` und `POSTGRES_DB` | Der alte Befehl bricht auf jedem Commit ab, weil `DATABASE_URL` fehlt |
| Backups | Seit 03.11. verschlüsselt aus `/opt/amanah-prod`, siehe [Doku 45](45-betrieb-produktion-und-backup.md) | Crontab angepasst und geprüft |
| Bilder geschützt | Tags bleiben; `images/hotfix.tar.gz` und `images/rollback.tar.gz` mit `SHA256SUMS`, Rechte 400 | nach `docker image prune -a` per `docker load` wiederherstellbar |
| Konfiguration gesichert | `config-vorher/`: vollständige Env-Datei, alte Compose-Dateien, Netze | Rollback ohne Rekonstruktion |
| Kontrolle | `/opt/amanah-prod/verify-production-image.sh`, nur lesend | seit 03.11. alle 15 Minuten, Doku 45 §3 |
| Netztrennung (Doku 29 §6) | App nur noch im Netz `amanah-app_amanah_internal` | Aus der App sind `gemeinsam1`-Dienste nicht mehr auflösbar |

**Abweichung vom Entwurf:** Der Entwurf wollte `.env.production` im alten Ordner löschen. Die Vorprüfung zeigte, dass der nächtliche Backup-Cron sie braucht; die Backups wären still ausgefallen. Deshalb bleibt eine reduzierte Datei. Ein früherer Entwurf der Compose-Datei hätte außerdem ein leeres Volume angelegt; das fand ein Trockenlauf vor der Installation.

**Bleibt möglich:** Wer absichtlich die Umgebung setzt oder einen Container von Hand startet, wird nicht aufgehalten. Der Schutz gilt gegen Versehen, nicht gegen Absicht. Die alte Secret-Kopie im Quellordner ist seit 03.11. entfernt.

### Nachprüfung

| Prüfung | Ergebnis |
|---|---|
| Referenz und ID | `amanah-app-app@sha256:f7f29e2a…`, ID identisch, keine Neustarts |
| Health, Prüfskript | 200, healthy, 6 von 6 OK |
| 142 Textproben, 39 URLs, KI | 0 Treffer; 27 × 404; 503 |
| Datenbank-Verbindung | `postgres` erreichbar; falsches Passwort 401 |
| Volume | `amanah_pg_prod`, erstellt 05.07., 47 MB, Postgres-Container seit 05.07. unverändert |
| Daten | 0 Konten, 1 Migration, 4 Tabellen; kein neues Volume |
| `gemeinsam1` | Container-IDs gleich; Antworten byte-gleich |
| Alter Weg | Beide Varianten mit `--build` brechen ab |
| Backup | vor und nach der Umstellung erstellt, 4 Tabellen; Crontab unverändert |

### Rollback (Route bleibt geschlossen)

Zurück auf die bisherige Compose-Struktur; `latest` zeigt weiter auf den Hotfix, die Texte bleiben also gesperrt:

```bash
cd /opt/amanah-app
docker compose -f docker-compose.prod.yml -f docker-compose.prod.nocaddy.yml \
  --env-file /opt/amanah-prod/config-vorher/.env.production up -d --no-deps --no-build app
```

Im Trockenlauf bleibt `amanah-postgres` laufen, und nur die App wird neu erstellt. Die App hängt danach wieder im `gemeinsam1`-Netz. Fehlt ein Image: `docker load < /opt/amanah-prod/images/<datei>`, vorher `sha256sum -c SHA256SUMS`.

### Künftige Änderungen

Aus `/opt/amanah-prod`: `docker compose -f docker-compose.pinned.yml --env-file .env.production …`. Vor jedem `up` den Compose-Hash von Postgres mit dem laufenden Container vergleichen (`config --hash postgres`). Ein neues Release braucht einen neuen Digest in dieser Datei.
