# Amanah / Mein Wille – Bestandsanalyse und Ausbaukonzept Vorsorge- und Testamentsportal

Stand: 2026-10-30 · Branch `feat/vorsorge-testament-foundation` (von `main` @ `1fdb5db`) · **nicht committet, nicht gepusht, nicht deployt**
Erstellt von: Claude Code (Agent). Keine Rechtsberatung, keine Fatwa, keine juristische Freigabe.

Zugehörige Dokumente:

- [00 – diese Datei](00-abschlussbericht.md): IST-Bericht, Matrix, Architektur, UX, Monetarisierung, Kanzleikonzept, Plan, Prüfergebnisse, Abschlussantworten
- [02 – True-Wills-Benchmark](02-true-wills-benchmark.md) (Phase B, Recherche-Agent, archivierte Quellen)
- [03 – Recht und Islamrecht](03-recht-und-islamrecht.md) (Phase C, Recherche-Agent, Quellenstatus [V]/[S]/[K])
- [04 – Islamisches Wissenszentrum](04-wissenszentrum.md) (P0-Ergänzung: Bestandsaufnahme, Struktur A–E, Freigabeprozess, Umsetzung)
- [05 – Quellenprüfung](05-quellenpruefung.md) (Qur'an-/Hadith-/Behördenquellen, Prüfagent, 30.10.)
- [06 – Sicherheit und Tests](06-sicherheit-und-tests.md) · [07 – Prisma 7](07-prisma7-analyse.md) · [08 – Vorsorge Plus](08-vorsorge-plus.md)
- [12 – Autopilot-Masterplan](12-autopilot-masterplan.md) · [13 – Launch-Readiness](13-launch-readiness.md) · [14 – Autopilot-Abschluss](14-autopilot-abschluss.md) · [15 – Verschlüsselung/Backup](15-verschluesselung-und-backup.md) · [16 – Einwilligung/Konto](16-einwilligung-und-konto.md) · [17 – Vorsorge Plus/Zahlung](17-vorsorge-plus-und-zahlung.md) · [18 – Testament/Prüfworkflow](18-testament-und-pruefworkflow.md)
- [09 – Quellenkorrektur](09-quellenkorrektur.md) ([09a Lizenzrecherche](09a-lizenz-und-texte-recherche.md)) · [10 – Redaktionsplan](10-redaktionsplan.md) · [11 – Offene Punkte Produktion](11-offene-punkte-produktion.md)
- Vorheriges Audit: `docs/qa/professional-product-audit.md` (18.08.2026, untracked) – teilweise überholt, siehe 1.9

Legende Belege: **[geprüft]** = in dieser Sitzung selbst ausgeführt/gelesen · **[laut Bericht]** = aus vorhandenem Bericht übernommen, nicht erneut ausgeführt · `NOT_RUN` = nicht ausgeführt.

---

## 1. IST-Bericht (Phase A)

### 1.1 Git und Arbeitsstand [geprüft]

| Punkt | Befund |
|---|---|
| Branch beim Start | `main` @ `1fdb5db` (Merge PR #6 „pilot-release-hardening“, 19.08.2026) |
| Remotes | `github/main` identisch; `origin/main` (GitLab) **16 Commits hinter** `main` |
| Offene Änderungen | nur untracked `docs/qa/` (Audit vom 18.08.) – unberührt gelassen |
| Weitere Branches | alle in `main` gemergt, außer `security/local-secret-containment-20260723` (1 Commit, nur `.gitignore`, nicht gemergt) |
| Worktree | `/mnt/daten/Projects/.msc-security-worktrees/amanah-app` als *prunable* gemeldet (nicht angefasst) |
| `AI_HANDOFF.md` | **fehlt** – nicht angelegt (laut Regeln erst nach Owner-Zustimmung) |

### 1.2 Technik und Deployment [geprüft]

- Next.js **16.2.10** → auf diesem Branch **16.4.3** (App Router, Turbopack, `output: "standalone"`), React 19.2.4, TypeScript 5, Tailwind 4, Zustand 5 (Persist).
- Persistenz: Modus `local` (Browser-LocalStorage) oder `api` (`/api/amanah`) mit Server-Speicher `memory` oder **Postgres via Prisma 6.19.3**.
- Datenmodell DB: `users`, `sessions` (Token-Hash), `amanah_data` (**ein JSON-Dokument pro Nutzer**, `schema_version`). Eine Migration (`20260705105925_init`).
- Deployment: Docker + Caddy + Postgres auf Hetzner vorbereitet (`docker-compose.prod.yml`, `docs/DEPLOY_HETZNER.md`). `deploy/Caddyfile` enthält noch `amanah.example.com` → **kein Hinweis auf ein laufendes Produktivsystem im Repo**. Preflight-Skript `scripts/validate-production-env.mjs` prüft Secrets/Modi.
- CI: GitHub Actions (lint, unit, build, Playwright Desktop+Mobile) und GitLab-CI mit Secret-Scanning (gitleaks).

### 1.3 Seiten, Module, Nutzerwege [geprüft: Routenliste aus Build, Code gelesen]

- **61 Routen** (Build-Ausgabe). Öffentlich: Start, Check, Wissen (14 Artikel), Preise, Login/Register, Akuter Todesfall, Janazah-Kompass, Barzakh, Testament & Erbe, Patientenverfügung, Sadaqa Jariya, Islam-oder-Kultur, Konvertierte, Bestatter (ohne Mock-Daten), Partner, Datenschutz, Sicherheit, Impressum (befüllt: MSC Engineering GmbH).
- **Dashboard „Mein Vorsorgeplan“** mit *einem* nächsten Schritt (`lib/plan/next-step.ts`), Fortschritt, 13 Modulen: Notfallkarte, Krankheit/Patientenverfügung, Vorsorgevollmacht, Betreuungsverfügung, Janazah (geführter Ablauf + Vorschau), Ghusl & Kafan, Bestattung/Überführung, Testament & Erbe, Schulden & Amanah, Digitaler Nachlass, Barzakh, Sadaqa Jariya, Familie/Familienbrief. Dazu Einstellungen, Geführtes Ausfüllen (24 Fragen), Assistent, PDF/Export, Gespräch mit Angehörigen.
- Hauptweg: Start → Check (15 Fragen, Fortschritt im Ordner-State) → ein nächster Schritt → Modul (Autosave + Speicherstatus) → Vorschau/Export.

### 1.4 Login, Rollen, Sicherheit, Datenschutz [geprüft]

| Thema | Befund | Bewertung |
|---|---|---|
| Auth | E-Mail/Passwort; `local` = Browser-Demo (Hash in LocalStorage), `api` = scrypt-Hash + Session-Token (SHA-256 mit Secret) in DB, 30 Tage | ok für Pilot |
| Token im Client | Bearer-Token in **LocalStorage** | XSS-empfindlich → P1: HttpOnly-Cookie |
| Rollen | **keine** (nur Nutzer). Kein Admin, keine Kanzlei-/Prüferrolle | für P3 nötig |
| Registrierung | in `api` standardmäßig **aus** (`AMANAH_PUBLIC_REGISTRATION_ENABLED`) | gut |
| Passwortregeln | **min. 6 Zeichen** → auf Branch 8 | P0 behoben |
| Brute-Force-Schutz | **kein** Rate-Limit an Login/Register → auf Branch ergänzt | P0 behoben |
| Session-Secret | Fallback `"dev-only-change-me"` auch in Produktion möglich → auf Branch: Fehler in Produktion | P0 behoben |
| Security-Header | nur via Caddy (HSTS, nosniff, SAMEORIGIN); Next sendet `X-Powered-By` → Branch: Header in `next.config.ts` | P0 behoben |
| Verschlüsselung at rest | JSON im Klartext in Postgres (Gesundheit, **Religion** = Art. 9 DSGVO) | P1: Feldverschlüsselung / Volume-Verschlüsselung, DSFA |
| Kontolöschung | `DELETE /api/amanah` löscht Daten, **nicht das Konto** | P1 (Art. 17 DSGVO) |
| E-Mail-Verifikation, Passwort-Reset, 2FA | fehlen | P1 vor öffentlicher Registrierung |
| `/api/health` | öffentlich, nennt Modi/Provider (keine Secrets) | P2 einschränken |
| Abhängigkeiten | `npm audit --omit=dev`: **11 Befunde, davon 1 critical (next: mehrere RCE-Advisories)** → Branch: 3 high (nur Prisma-6-Kette, Fix erfordert Prisma 7) | P0 behoben bis auf Prisma |

### 1.5 Fachmodule [geprüft]

- **Amanah-Check**: 15 Ja/Nein-Fragen, State-Machine, Ergebnis mit einem nächsten Schritt; Fortschritt versioniert im Ordner (`checkProgress`).
- **Janazah**: stärkstes Modul – strukturierte Felder (`JanazahWishes`, `GhuslKafanWishes`, `BurialPreference`), geführter Ablauf, Vorschau, rechtlicher Hinweis.
- **Familie**: `FamilyMember[]` existiert im Datenmodell, wird aber **von keiner UI genutzt**. Das Erbprofil (`InheritanceProfile`) zählt Söhne/Töchter separat. → Wiederverwendungspotenzial.
- **Dokumente**: `DocumentEntry` nur als *Ablageort-Hinweis* (Typ, Titel, Ort, `reviewStatus`). **Kein Upload, kein Tresor.**
- **PDF**: Druckansichten + `window.print()`; JSON-Export/-Import; lesbarer Notfall-Export; Familienbrief-Template.
- **Testament & Erbe**: Erbprofil-Formular + Stichwort-„Ampelcheck“. **Kritisch:** Status „Grün — Grundsätzlich in Ordnung“ und im Druck „Testament-Vorbereitung – Ampelcheck: Grün“ auf Basis weniger Stichworte (`includes("alles")` traf z. B. auch „Notfalles“). → Branch: neutrale Hinweis-Labels, Pflichthinweis, § 2247-Hinweis im Druck.
- **Wissen**: 14 Themen mit Quellenmodell (Quran/Hadith-IDs, `reviewStatus`); fast alle `needs_scholar_review`.
- **KI**: Provider `rules` (Default, kostenlos), `mock`, optional OpenAI. KI-UI standardmäßig aus (`NEXT_PUBLIC_AMANAH_AI_ENABLED`), Server-Consent-Gate für personenbezogene Daten. Befund: der (nicht eingebundene) Floating-Chat sendete `consentGranted: true` fest verdrahtet und den gesamten Store → Branch behoben. Strukturell bleibt: Consent ist nur ein Client-Flag (P1: serverseitig speichern).
- **Mehrsprachigkeit**: 6 Sprachen angelegt; DE/EN umfangreich (~260 Keys), TR/AR/BS/SQ nur ~60 Keys; viele UI-Texte hart auf Deutsch.
- **Zahlungen**: **keine Zahlungsintegration**. Nur Preisseite (0/29/79/99 €, Kauf-Buttons deaktiviert) und `src/lib/mock/pricing.ts`.
- **Mobil**: Mobile-Navigation, Sticky-CTA, Playwright-Projekt „Pixel 5“ vorhanden. Visuelle Prüfung in dieser Sitzung `NOT_RUN` (siehe 1.7).

### 1.6 Tests [geprüft]

| Prüfung | `main` (Start) | Branch (Ende) |
|---|---|---|
| Vitest | 24 Dateien, **351 bestanden, 1 skipped** | 25 Dateien, **369 bestanden, 1 skipped** (+18 neue Tests) |
| ESLint | 0 Fehler, 1 Warnung (`slugFromPath` unbenutzt) | unverändert |
| `tsc --noEmit` | ok | ok |
| Production Build | ok (Next 16.2.10, isolierte Kopie im Scratchpad) | ok (Next 16.4.3, isolierte Kopie) |
| HTTP-Smoke-Test (Port 3199) | 19 Routen geprüft, erwartete Codes | 6 Kernrouten 200; Header gesetzt; Login nach 10 Fehlversuchen → 429; Passwort < 8 → abgelehnt |
| Playwright E2E | `NOT_RUN` – kein Chromium/Playwright-Browser installiert | `NOT_RUN` |
| Postgres-Tests | 1 skipped (keine DB) | 1 skipped |

E2E-Ergebnis vom 18.08. (33/33 Desktop, 33/33 Mobile) gilt nur **[laut Bericht]** für einen älteren Stand.

### 1.7 Browserprüfung

`NOT_RUN`. Für die Installation des Playwright-Chromiums wäre ein Download in den globalen Cache nötig; das habe ich nicht ungefragt getan. Vorhandene Screenshots: `docs/qa/screenshots/` (18.08.) **[laut Bericht]**.

### 1.8 Bekannte technische Probleme

1. Prisma 6 mit 3 high-Advisories (Fix nur mit Prisma 7 – eigener Upgrade-Schritt).
2. Eine JSON-Spalte pro Nutzer: keine feingranulare Zugriffskontrolle, kein Audit, keine Versionierung → für Testament/Anwaltsfreigabe ungeeignet.
3. Rate-Limit nur prozesslokal (In-Memory-Map) – reicht für eine Instanz.
4. GitLab-Remote 16 Commits hinter GitHub.
5. Kein Onboarding-Konto-Upgrade von `local` → `api` (Daten bleiben im Browser).

### 1.9 Was sich seit dem Audit vom 18.08. geändert hat [geprüft]

Erledigt: Mock-Bestatter entfernt, `/brand-review` in Produktion 404, Impressum befüllt, KI-UI standardmäßig aus, Familiengespräch auf Vorsorge umgestellt, Check-Fortschritt im Ordner, Einstellungsseite, Janazah-Stepper, Pricing ohne Abos. Offen geblieben: siehe 1.4/1.5.

---

## 2. Funktionsmatrix

| Funktion | Bereits vorhanden | Wiederverwendbar | Änderungen erforderlich | Neu zu entwickeln |
|---|---|---|---|---|
| Notfallinformationen | Notfallkarte, Akuter-Todesfall-Seite | ja | Integration in „Meine Vorsorge“ | – |
| Persönliche Infos | `UserProfile`, `EmergencyCard` | ja | zusammenführen | – |
| Janazah-Wünsche | geführter Ablauf, Vorschau, Druck | **ja, voll** | – | Bundesland-Hinweise (Sargpflicht etc.) |
| Familienbrief | Template, optional KI | ja | Einbindung in Exportende | – |
| Familie / Erben | `FamilyMember[]` (ungenutzt), Erbprofil-Zähler | Datenmodell ja | **eine** Personenliste für Notfall, Vollmacht, Erbe | Personen-UI |
| Dokumente | Ablageort-Hinweise | ja | Status-Lebenszyklus | verschlüsselter Upload/Tresor (P2/P3) |
| Vermögen/Schulden | `AssetEntry`, `DebtAmanahItem` | ja | Vermögensübersicht für Testament | – |
| Waṣiyya / Sadaqa | Freitext + Stichwortprüfung | teilweise | strukturierte Vermächtnisse mit 1/3-Prüfung | Vermächtnis-Editor |
| Islamische Erbquoten | **Prototyp auf Branch** (deaktiviert, ungeprüft) | Engine ja | Gelehrten-Review, Schulwahl | erweiterte Regelwerke |
| Deutsche Rechtschecks (Pflichtteil, Form) | Hinweistexte | – | – | regelbasierte Hinweis-Engine (anwaltlich abgenommen) |
| Testament-Fragebogen | Erbprofil-Formular | teilweise | Schritt-für-Schritt | Fragebogen, Versionierung |
| Entwurfsvorbereitung | Druckansicht „Testament-Vorbereitung“ | Layout | „KEIN TESTAMENT“-Kennzeichnung (erledigt) | Gesprächsunterlage für Anwalt |
| Anwaltlicher Prüfprozess | – | – | – | Rollen, Freigaben, Fallzugriff, Audit |
| Consent & Audit | KI-Consent (Client) | Ansatz | serverseitig speichern | Audit-Log, Art.-9-Einwilligung |
| Billing / Produkte | Preisseite, `pricing.ts` | Texte | Produktzuschnitt neu | Checkout (z. B. Stripe), Entitlements |
| Login / Konto | E-Mail/Passwort, Sessions | ja | Cookie statt LocalStorage, Konto löschen | E-Mail-Verify, Reset, 2FA |
| Wissen | 14 Artikel mit Quellen | ja | Gelehrten-Review | Erbrechts-Erklärartikel (DE vs. islamisch) |
| Mehrsprachigkeit | DE/EN, Rest rudimentär | Struktur | Abdeckung | TR/AR (RTL) Inhalte |
| KI | rules/mock/OpenAI, Safety, Zod-ähnliche Validierung | ja | Consent serverseitig | – (bewusst begrenzt) |
| Mobile | responsive, Mobile-Nav | ja | Prüfung `NOT_RUN` | – |

---

## 3. True Wills – Kurzfazit (Details: Dokument 02)

- truewills.co.uk ist am 2026-10-30 **offline** („Account Suspended“); Nachfolger ist Wahed Wills (Übernahme 02/2023). Analyse beruht auf Archiv-Snapshots → **historischer Benchmark**.
- Modell: kostenloser Fragebogen + Vorschau, Bezahlung beim Einreichen zur Prüfung (£98), Prüfung durch hauseigenen Solicitor, PDF zum Ausdrucken und Unterschreiben vor zwei Zeugen, Islamquoten im „Letter of Wishes“ via Trust-Konstruktion.
- **Nicht übertragbar**: das PDF-Testament (in DE formnichtig, § 2247 BGB), hausinterne Rechtsprüfung (RDG), Trust-Konstruktion. **Übertragbar**: Einstieg ohne Konto, kurze Schritte mit Zeitangabe, Waṣiyya-Drittel als Prozent, Statusmodell.
- **Lücken bei True Wills**, die Amanah besser lösen kann: keine Rechtsschulwahl, kein Pflichtteilsabgleich, Janazah nur als Freitext im Testament (kommt zu spät), keine Vorsorgedokumente.

---

## 4. Rechtliche Anforderungen – Kurzfazit (Details: Dokument 03)

| # | Anforderung | Quelle | Produktfolge |
|---|---|---|---|
| R1 | Eigenhändiges Testament vollständig handschriftlich | § 2247 BGB [V] | Kein Ausdruck, der wie ein Testament wirkt; nur Vorbereitungs-/Abschreibunterlage oder Entwurf für Notar/Anwalt |
| R2 | Pflichtteil bleibt bestehen | §§ 2303 ff. BGB | Konflikthinweis v. a. Ehegatte (Zugewinn) und nichtmuslimische Angehörige |
| R3 | Rechtswahl nur zum Heimatrecht, nicht „Scharia“ | Art. 22 EuErbVO [S] | keine Auswahlhilfe, nur Hinweis auf Anwalt |
| R4 | Drittbestimmungsverbot | § 2065 Abs. 2 BGB [V] | „Ein Imam soll verteilen“ nicht als Lösung anbieten |
| R5 | Standardisierter Generator ≠ Rechtsdienstleistung, Einzelfallprüfung schon | BGH I ZR 113/20 [V], § 2 RDG [V] | Keine individuellen Wirksamkeitsaussagen; Einzelfallprüfung nur durch Anwälte |
| R6 | Provisionsverbot für Mandatsvermittlung | § 49b Abs. 3 BRAO [V], § 27 BORA [S] | Keine Vermittlungsprovision; Kanzlei-Listing nur mit fixer, erfolgsunabhängiger Gebühr – **anwaltlich zu prüfen** |
| R7 | Religion = besondere Kategorie | Art. 9 DSGVO [K] | ausdrückliche Einwilligung, DSFA, Verschlüsselung, AVV |
| R8 | Vormundbenennung nur in formgültigem Testament | § 1782 BGB [V] | im Fragebogen erfassen, Hinweis auf Form |
| R9 | Ordre public bei Pflichtteilsentzug durch Rechtswahl | BGH IV ZR 110/21 [V] | Auslandsbezug → Sperre + Anwalt |

**Besondere Fragestellung** („nach islamischen Erbgrundsätzen verteilen“): Der bloße Verweis ist wegen Bestimmtheit, § 2065 Abs. 2, offener Schulfragen und Pflichtteil riskant. Diskutierte Strukturen (alle **UNGEKLÄRT / anwaltlich zu prüfen**): konkrete Quoten zum Errichtungszeitpunkt + Ersatzregeln (Option C), plus Anpassungsmechanik (D), deutsche Grundstruktur + Vermächtnisse (E), lebzeitige Flankierung wie notarieller Pflichtteilsverzicht (F). Eine einschlägige deutsche Entscheidung zu einem ausdrücklich islamisch begründeten Testament wurde **nicht gefunden** → juris/beck-online-Recherche durch Kanzlei.

---

## 5. Zielarchitektur und Datenmodell (Phase D)

Prinzip: **Modularer Monolith im bestehenden Next.js/Prisma-Stack**, keine Microservices. Fachlogik als reine TypeScript-Module unter `src/lib/*`, deterministisch und testbar; UI nur Darstellung.

```
src/lib/
  family/            Family Profile – eine Personenliste (Rolle: Notfall, Vollmacht, Erbe, Vormund)
  estate/            Estate Profile – Vermögen, Schulden, Auslandsbezug (wiederverwendet AssetEntry/Debt)
  inheritance/       Islamic Inheritance Rules – exakte Brüche, versionierte Regelwerke, Sperren  ← angelegt
  german-law/        German Estate Law Checks – nur Hinweisregeln, von Kanzlei abgenommen, versioniert
  testament/         Questionnaire + Draft Preparation – Schritte, Entwurfsversionen, Status
  review/            Legal Review Workflow – Prüfaufträge, Freigaben pro Fall
  documents/         Document Generation – Vorbereitungsunterlagen (nie „Testament“)
  consent/ audit/    Einwilligungen (Art. 9, KI, Weitergabe) und unveränderliches Audit-Log
  billing/           Products & Entitlements – Provider-Adapter, zunächst "disabled"
  flags/             Feature-Flags, Default aus                                               ← angelegt
```

**Status-Trennung (verbindlich):** `draft` → `ready_for_review` → `in_legal_review` → `legal_feedback` → `user_confirmed_draft` → `formally_executed_by_user` (nur Selbstauskunft: „eigenhändig geschrieben / notariell beurkundet“). Die App setzt nie selbst „wirksam“.

**Islamisches Regelwerk (Prototyp, auf Branch):**

- `fraction.ts`: exakte Brüche, Überlauf wirft Fehler statt zu runden.
- `rulesets.ts`: `RuleSet { id, version, schools, reviewStatus, reviewedBy, sourceIds }`. Einziges Regelwerk `sunni-nuclear-family@0.1.0` = **`unreviewed_draft`**.
- `calculate.ts`: Ehegatte, Söhne, Töchter, Vater, Mutter; ʿAwl. **Gesperrt** statt berechnet: Radd, Geschwister (wo relevant), Großeltern, Enkel, ʿUmariyyatān, Mehrehe, Religionsverschiedenheit, Stief-/Adoptivkinder, Sonderumstände.
- Jeder Schritt mit Regeltext und Quell-ID (Quran 4:11/4:12 aus `quran-verses.ts`).
- `isRuleSetDisplayable()` = Flag an **und** `scholar_reviewed` → derzeit für jede Kombination `false`. Keine UI eingebunden.
- Tests: Lehrbuchfälle (1/8–7/12–7/24; ʿAwl 27 „Minbariyya“; ʿAwl 13) – der 7/24- und der 13er-Fall decken sich unabhängig mit der Tabelle in Dokument 03, Abschnitt 3.3. **Das ersetzt keine Gelehrtenprüfung.**

**Datenmodell (Vorschlag, noch nicht migriert):**

```prisma
model Person        { id, ownerId, displayName, relation, birthYear?, isMuslim?, roles String[], encrypted Json? }
model EstateItem    { id, ownerId, kind, country, approxValueCents?, notes(encrypted) }
model TestamentCase { id, ownerId, status, ruleSetId, ruleSetVersion, createdAt, updatedAt }
model DraftVersion  { id, caseId, version Int, inputSnapshot Json(encrypted), resultSnapshot Json, createdAt }  // unveränderlich
model ReviewRequest { id, caseId, lawFirmId, status, consentId, expiresAt, deletedAt? }
model LawFirm       { id, name, contactRef, active }   LawyerUser { id, lawFirmId, userId }
model ConsentRecord { id, userId, purpose, textVersion, grantedAt, revokedAt? }
model AuditEvent    { id, actorId, actorRole, caseId?, action, at, meta Json }   // append-only
model Entitlement   { id, userId, productId, source, grantedAt }
```

Zugriffsregel: Kanzleien sehen **nur** `ReviewRequest` mit gültiger Einwilligung und nur bis Ablauf; jede Einsicht erzeugt ein `AuditEvent`. Sensible Felder anwendungsseitig verschlüsselt (Schlüssel außerhalb der DB).

---

## 6. UX-/UI-Konzept (Phase E)

**Startseite – zwei Einstiege**

```
┌──────────────── Mein Wille ────────────────┐
│ Damit deine Familie weiß, was du willst.   │
│                                            │
│ [ Meine Vorsorge ]      [ Mein Testament ] │
│  Notfall, Janazah,       Vorbereitung für  │
│  Dokumente, Brief        Gespräch mit      │
│  · sofort nutzbar        Anwalt/Notar      │
│                          · „Vorschau“      │
│ Kostenloser Check – ohne Konto (3 Min.)    │
└────────────────────────────────────────────┘
```

- **Meine Vorsorge** = bestehende Module neu gruppiert: Persönliches (Notfallkarte), Janazah, Wichtige Dokumente, Familienbrief, Notfallinformationen. *Keine neue Fachlogik nötig.*
- **Mein Testament** (Flag aus, bis Freigabe): Eignungsprüfung (Wohnsitz DE? Auslandsvermögen? Unternehmen? andere Religion in der Familie? → Sperr-/Anwaltshinweis) → Familie (aus Personenliste vorbelegt) → Nachlass → Islamische Wünsche (Rechtsschule, Waṣiyya ≤ 1/3) → Rechtliche Hinweise (Form, Pflichtteil, in einfacher Sprache) → Zusammenfassung („Gesprächsunterlage, kein Testament“) → optionale anwaltliche Prüfung.
- Muster: eine Frage pro Bildschirm, Fortschrittsbalken mit Schrittzahl, Autosave mit sichtbarem Status (vorhanden: `SaveStatusIndicator`), Glossar-Tooltips für Pflichtteil/Vermächtnis/Waṣiyya, Registrierung erst beim dauerhaften Speichern.
- Verbotene Formulierungen: „rechtsgültig“, „rechtssicher“, „Testament erstellt“, „geprüft“ ohne Prüfer und Datum.
- Lokale Umsetzung der Startseiten-Variante: noch **nicht** gebaut (Freigabe von Text/Positionierung durch Owner sinnvoll, siehe offene Fragen).

---

## 7. Monetarisierung (Phase F)

| Produkt | Inhalt | Preis (Test) | Voraussetzung | Status |
|---|---|---|---|---|
| **Amanah Vorsorge Plus** | Vorsorgeordner, Janazah, Dokumentenübersicht, Familienbrief, PDF/JSON-Export | 29–39 € einmalig | P0+P1 erledigt, Zahlungsanbieter, AGB/Widerruf, DSGVO-Paket | **vermarktbar nach P1** |
| **Amanah Testament-Vorbereitung** | Fragebogen, Bildungsrechnung (geprüft), Gesprächsunterlage, Hinweise | 49–79 € | Owner-Freigabe Leistungsumfang, Gelehrten-Review, anwaltliche Prüfung des **Produkts** (RDG/UWG) | gesperrt |
| **Testament mit juristischer Prüfung** | Übergabe an unabhängige Kanzlei | Kanzleihonorar direkt an Kanzlei | Kooperationsvertrag, RDG/BRAO-Klärung | gesperrt |

Vorhanden zur Wiederverwendung: Preisseite und `pricing.ts` (Texte); **keine Zahlungslogik**. Empfehlung: Stripe Checkout (Einmalzahlung) über einen `billing`-Adapter mit `Entitlement`-Tabelle; bis zur Freigabe Provider `disabled`. Achtung Einmalpreis vs. laufende Hosting-/Speicherkosten (Audit 18.08., Abschnitt 14.10).

---

## 8. Kanzlei-Kooperation (Phase G)

**Ablauf:** Nutzer erstellt Entwurf → wählt „Prüfung anfragen“ → sieht Kanzlei, Leistungsumfang, **Festpreis der Kanzlei** → erteilt Einwilligung (Zweck, Empfänger, Dauer, Widerruf) → System erzeugt `ReviewRequest` mit eingefrorener `DraftVersion` → Kanzlei erhält Benachrichtigung **ohne Inhalte** → Kanzlei schließt Mandat **direkt** mit Nutzer (eigene AGB/Vollmacht/Honorar) → Kanzlei sieht nur diesen Fall, Zugriff zeitlich begrenzt, protokolliert → Rückmeldung als Dokument/Kommentar → Status `legal_feedback` → nach Abschluss automatische Löschung der Kanzleikopie (Frist vereinbaren).

**Leitplanken:** Amanah ist Softwareanbieter, nicht Rechtsdienstleister; keine erfolgsabhängige Provision (§ 49b Abs. 3 BRAO); keine pauschalen Kanzleizugänge; keine automatische Freigabe; AVV bzw. getrennte Verantwortlichkeit klären; Ende-zu-Ende- oder zumindest Transportverschlüsselung + verschlüsselte Ablage.

**Fragenkatalog für Kanzleipartner**

1. Welche Leistung bieten Sie zu welchem Festpreis an (Prüfung, Entwurf, notarielle Begleitung)?
2. Wie begründen Sie das Mandat (Vollmacht, Honorarvereinbarung, Identitätsprüfung, Konfliktprüfung)?
3. Welche Vergütungsmodelle zwischen Plattform und Kanzlei halten Sie mit § 49b Abs. 3 BRAO und § 27 BORA für vereinbar (fixe Listing-Gebühr, Softwarelizenz)?
4. Sind Sie Verantwortlicher oder Auftragsverarbeiter für die übermittelten Daten? Welche Löschfristen gelten?
5. Welche Erfahrung haben Sie mit EuErbVO, Auslandsimmobilien (Türkei, Maghreb, Balkan) und ordre public?
6. Wie bewerten Sie Strukturoptionen C–F aus Dokument 03 für den Wunsch nach islamischer Verteilung?
7. Ab wann ist unsere Bildungsrechnung bzw. Parallelanzeige BGB/Pflichtteil eine Rechtsdienstleistung (Smartlaw-Abgrenzung)?
8. Würden Sie unsere Hinweistexte und den Fragebogen vorab (gegen Honorar) prüfen und versioniert abnehmen?
9. Berufshaftpflicht: Deckungssumme, Mandate über Plattformen eingeschlossen?
10. Reaktionszeit, Sprachen (TR/AR/BS), Fernmandat, bundesweit?
11. Wie gehen Sie mit Interessenkonflikten in Familien um (mehrere Angehörige als Nutzer)?
12. Welche Unterlagen brauchen Sie mindestens; was soll die Plattform nicht übermitteln?

---

## 9. Priorisierter Entwicklungsplan

| Prio | Arbeitspaket | Aufwand (PT, Schätzung) | Status |
|---|---|---|---|
| **P0** | Next.js-Security-Upgrade, Header, Rate-Limit, Passwortminimum, Session-Secret-Pflicht, KI-Consent im Float, irreführende Ampel-Labels | 1,5 | **auf Branch erledigt** (uncommitted) |
| P0 | Prisma 6 → 7 Upgrade inkl. Tests | 1–2 | offen |
| P0 | Playwright-E2E lokal/CI auf neuem Stand laufen lassen | 0,5 | `NOT_RUN` |
| P0 | DSFA + Verzeichnis von Verarbeitungstätigkeiten, Art.-9-Einwilligung | 2–3 (+ Datenschutzberatung extern) | offen |
| P1 | Session per HttpOnly-Cookie, Konto löschen, E-Mail-Verify, Passwort-Reset | 4–6 | offen |
| P1 | Anwendungsseitige Verschlüsselung sensibler Felder, Backups verschlüsselt | 3–4 | offen |
| P1 | Startseite „Meine Vorsorge / Mein Testament“ + Neugruppierung Dashboard | 3–4 | offen |
| P1 | Personenliste (FamilyMember) einheitlich nutzen | 3–4 | offen |
| P1 | Dokumentenstatus/Checkliste (ohne Upload) | 1–2 | offen |
| P1 | Billing-Adapter + Entitlements (Provider disabled), AGB/Widerruf | 4–6 | offen |
| P2 | Testament-Fragebogen hinter Flag, Entwurfsversionierung, Gesprächsunterlage | 8–12 | Grundlage (Engine) angelegt |
| P2 | Regelwerke erweitern + Gelehrten-Review-Workflow | 5–8 (+ externe Prüfung) | offen |
| P2 | Deutsche Hinweis-Engine (Pflichtteil/Form) nach Kanzleiabnahme | 4–6 | offen |
| P3 | Rollen/Kanzleiportal, ReviewRequest, Audit, Löschung | 10–15 | offen |
| P3 | Verschlüsselte Dokumentenablage für Prüffälle | 5–8 | offen |

---

## 10. Vorgenommene Änderungen (Branch `feat/vorsorge-testament-foundation`, **uncommitted**)

| Datei | Änderung |
|---|---|
| `package.json`, `package-lock.json` | `next` und `eslint-config-next` 16.2.10 → 16.4.3 (exakt gepinnt); `npm audit fix` (nicht-brechend) |
| `next.config.ts` | `poweredByHeader: false`; Security-Header (nosniff, DENY, Referrer-, Permissions-Policy) |
| `src/lib/server/crypto.ts` | Session-Secret-Pflicht in Produktion |
| `src/lib/auth/config.ts` | `MIN_PASSWORD_LENGTH = 8`, gemeinsame Fehlermeldung |
| `src/lib/server/repository/{postgres,memory}-repository.ts`, `src/lib/server/memory-store.ts`, `src/lib/auth/local-auth-provider.ts`, `src/components/auth/auth-form.tsx` | Passwortminimum zentral; Memory-Token kryptografisch |
| `src/lib/ai/rate-limit.ts` | optionales Limit pro Schlüssel |
| `src/app/api/auth/login/route.ts`, `.../register/route.ts` | Rate-Limit (10/min pro IP und E-Mail; 5 Registrierungen/min pro IP) |
| `src/components/ai/amanah-assistant-float.tsx` | Consent aus gespeicherter Einwilligung statt `true`; nur Datenfelder senden |
| `src/app/dashboard/page.tsx` | Speicherhinweis abhängig vom Speichermodus |
| `src/lib/domain/validation.ts`, `src/app/dashboard/testament/page.tsx`, `src/app/dashboard/pdf/page.tsx`, `src/lib/modules/config.ts`, `src/lib/mock/pricing.ts` | Neutrale Hinweis-Labels statt „Grün — Grundsätzlich in Ordnung“; Pflichthinweis; § 2247-Hinweis im Druck; Wortgrenzen-Regex |
| `src/lib/flags/testament-preparation.ts` | neues Flag, Default aus |
| `src/lib/inheritance/*` | exakte Brüche, Regelwerk-Typen, ungeprüftes Regelwerk, Berechnung mit Sperren |
| `src/__tests__/inheritance.test.ts` | 18 Tests |
| Wissenszentrum (siehe Dokument 04, Abschnitt 4) | Modul `src/modules/islamic-knowledge/`, Artikel-/Redaktionsseiten, Gate für 5 Themenseiten, Mock-Spendenprojekte entfernt, tote Startseiten-Links, 16 Tests |
| `docs/strategy/*` | diese Dokumente |

**Commits: keine.** Push/Merge/Deployment: keine.

---

## 11. Abschlussantworten

1. **Technische Grundlage vorhanden:** ca. **40 %** (Schätzung, gewichtet): Vorsorgeprodukt ~75 %, Testament-Vorbereitung ~20 % (Erbprofil, Wissensbasis, jetzt Engine-Prototyp), Kanzlei-Workflow ~0–5 %, Billing ~5 % (nur Preisseite).
2. **Sofort verkaufbar ohne unzulässige Rechtsdienstleistung:** der **Vorsorgeordner** (Notfall, Janazah, Dokumentenübersicht, Familienbrief, Export) – nach Abschluss der P0/P1-Punkte (Datenschutz, Konto-Funktionen, Zahlung, AGB). Testament-Funktionen nur als allgemeine Wissensinhalte.
3. **Zwingend deutscher Erbrechtsanwalt (bzw. Notar):** jede Einzelfallaussage zu Wirksamkeit, Pflichtteil, Güterstand, Rechtswahl/Auslandsvermögen; Abnahme der Hinweistexte und des Fragebogens; Bewertung der Strukturoptionen C–F; Vergütungsmodell der Kooperation; Errichtung eines notariellen Testaments.
4. **Übernehmbare Amanah-Funktionen:** Janazah-Modul komplett, Notfallkarte, Vollmacht/Betreuung/Patientenverfügung-Hinweise, Familienbrief, Druck/JSON-Export, Check + nächster Schritt, Autosave/Speicherstatus, Auth/Sessions/Postgres, Wissensbasis mit Quellenmodell, KI-Safety-Schicht, Release-Checks.
5. **Technisch notwendige Änderungen:** relationale Tabellen statt eines JSON-Blobs für Testament/Prüfung, Verschlüsselung, Rollen + Audit, Cookie-Sessions, Kontolöschung/-verifikation, Billing-Adapter, Prisma-7-Upgrade, E2E-Lauf.
6. **Bewusst nicht entwickeln:** druckfertige „Testamente“ oder Musterklauseln; Aussagen „rechtsgültig/rechtssicher“; automatische Freigaben; KI, die Erbquoten oder Rechtsfolgen entscheidet; Imam-/Dritt-Bestimmung der Erben als Lösung; Rechtswahl-Assistent; Provisions-Vermittlung an Kanzleien; Mehrehe- und Religionsverschiedenheits-Berechnungen.
7. **Verbleibender Aufwand:** ca. **20–30 PT** bis vermarktbares Vorsorge Plus (P0+P1); weitere **20–30 PT** für Testament-Vorbereitung (P2); weitere **15–25 PT** für Kanzleiprozess (P3). Gesamt grob **55–85 PT**, ohne externe Prüfzeiten.
8. **Laufende Kosten (Schätzung, Preise nicht verifiziert):** Hetzner-Server + Backup ~10–40 €/Monat, Domain/E-Mail ~5–15 €/Monat, Zahlungsgebühren pro Transaktion (anbieterabhängig), optional OpenAI nutzungsabhängig (Default aus = 0 €). Wesentlich höher: **externe Fachkosten** – Datenschutzberatung/DSB, anwaltliche Prüfung von AGB/Texten/Produkt, Gelehrten-Review, ggf. Versicherung. Diese einmalig bzw. jährlich einplanen.
9. **Kleinste sicher vermarktbare Version:** „Vorsorge Plus“ als Einmalkauf: Check → Vorsorgeplan → Janazah/Notfall/Dokumentenübersicht/Familienbrief → PDF-Export, Server-Speicherung mit Verschlüsselung, Kontolöschung, Art.-9-Einwilligung, AGB/Widerruf, Testament nur als Wissensbereich. Keine Erbquoten.
10. **Was den Produktionsstart aktuell verhindert:** (a) diese Änderungen sind uncommitted und ungetestet in E2E; (b) Prisma-Advisories; (c) keine DSFA/Art.-9-Einwilligung, keine Verschlüsselung at rest; (d) keine Kontolöschung/E-Mail-Verifikation/Reset; (e) keine Zahlungsabwicklung + AGB/Widerrufsbelehrung; (f) Caddy-Domain ist Platzhalter; (g) Wissensinhalte überwiegend `needs_scholar_review`; (h) Produktumfang Testament nicht freigegeben, keine Kanzlei; (i) `SECURITY.md`-Kontakt ist Platzhalter.
