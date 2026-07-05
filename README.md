# AmanahOrdner

**Der islamische Vorsorge-, Janazah-, Testament-, Barzakh- und Sadaqa-Jariya-Kompass für Muslime in Deutschland.**

> Islamisch vorbereitet — bevor deine Familie im schwersten Moment aus Panik, Kultur oder Unwissen entscheiden muss.

## USP

AmanahOrdner verbindet islamisches Wissen, Vorsorge, Testament-Vorbereitung, Kulturfilter, Bestatter-Notfallkette und Sadaqa Jariya in einem geführten System.

**Claim:** Für Krankheit. Für Janazah. Für Barzakh. Für deine Familie.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Zustand** (State + LocalStorage Persist)
- **Vitest** (Tests)
- **PWA-ready** (manifest.json, responsive, installierbar vorbereitet)
- **AI Provider Layer** (Mock default, OpenAI optional)

## Setup lokal

```bash
git clone https://github.com/sonjasungur/amanah-app.git
cd amanah-app
npm install
cp .env.example .env.local
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

### Environment Variables

Siehe `.env.example`:

| Variable | Beschreibung | Default |
|----------|-------------|---------|
| `AMANAH_AI_PROVIDER` | `rules`, `mock` oder `openai` | `rules` |
| `AMANAH_AI_ENABLED` | KI ein/aus | `true` |
| `AMANAH_AI_MODEL_FAST` | Schnelles Modell (OpenAI) | Env/OpenAI default |
| `AMANAH_AI_MODEL_SMART` | Smartes Modell (OpenAI) | Env/OpenAI default |
| `OPENAI_API_KEY` | OpenAI API Key (nur Server) | — |
| `AI_PROVIDER` | Legacy-Alias für Provider | `rules` |
| `NEXT_PUBLIC_APP_URL` | App URL | `http://localhost:3000` |

## Wichtige Routen

### Öffentlich

| Route | Beschreibung |
|-------|-------------|
| `/` | Landing Page |
| `/check` | Kostenloser 10-Fragen-Amanah-Check |
| `/akuter-todesfall` | Soforthilfe bei Todesfall |
| `/janazah-kompass` | Janazah-Wissensseite |
| `/islam-oder-kultur` | Kulturfilter |
| `/barzakh` | Barzakh-Wissen |
| `/testament-erbe` | Islamisches Erbe |
| `/patientenverfuegung` | Patientenverfügung |
| `/sadaqa-jariya` | Sadaqa Jariya + Gemeinsam1 |
| `/bestatter` | Bestatter-Verzeichnis |
| `/preise` | Preisübersicht |
| `/partner` | Partnerbereich |
| `/datenschutz` | Datenschutz |
| `/impressum` | Impressum |

### App / Dashboard

| Route | Modul |
|-------|-------|
| `/dashboard` | Übersicht |
| `/dashboard/notfallkarte` | Notfallkarte |
| `/dashboard/krankheit` | Krankheit & Patientenverfügung |
| `/dashboard/vollmacht` | Vorsorgevollmacht |
| `/dashboard/betreuung` | Betreuungsverfügung |
| `/dashboard/janazah` | Janazah-Wünsche |
| `/dashboard/ghusl-kafan` | Ghusl & Kafan |
| `/dashboard/bestattung` | Bestattung / Überführung |
| `/dashboard/testament` | Testament & Erbe |
| `/dashboard/schulden-amanah` | Schulden & Amanah |
| `/dashboard/digitaler-nachlass` | Digitaler Nachlass |
| `/dashboard/barzakh` | Barzakh-Plan |
| `/dashboard/sadaqa-jariya` | Sadaqa Jariya |
| `/dashboard/familie` | Familiengespräch |
| `/dashboard/pdf` | PDF & Export |
| `/dashboard/assistent` | Amanah-Assistent |

## Lokale Speicherung

- Alle Formulardaten werden **lokal im Browser** gespeichert (LocalStorage via Zustand Persist).
- Buttons: „Lokal speichern", „Lokale Daten löschen"
- **JSON Export/Import** für Backup und Gerätewechsel
- Hinweis: Keine öffentlichen Geräte für sensible Daten nutzen.
- **Keine Passwörter** werden gespeichert. Digitaler Nachlass enthält nur Hinweise.

## PDF / Print-Export

- Druckoptimierte Ansichten mit `window.print()`
- Im Druckdialog: „Als PDF speichern" wählen
- Exporte: AmanahOrdner Komplett, Notfallkarte, Janazah-Anweisung, Testament-Report, Schulden-Liste, Familienbrief

## Knowledge Base (Phase 3B)

### Default: Keyword Retrieval (no cost)

```env
AMANAH_KNOWLEDGE_RETRIEVAL=keyword    # keyword | embedding | hybrid
AMANAH_EMBEDDING_PROVIDER=none         # none | openai (optional, server-side)
AMANAH_EMBEDDING_MODEL=                # e.g. text-embedding-3-small
```

Antworten im Knowledge Helper basieren **nur auf kuratierten Einträgen** mit Quellenangabe — keine freie Halluzination.

| API | Beschreibung |
|-----|-------------|
| `GET /api/knowledge/search?q=...` | Keyword-Suche |
| `GET /api/knowledge/entries` | Produktive Einträge (DE) |
| `GET /api/knowledge/entries/[id]` | Einzeleintrag |

Neue Einträge in `src/lib/knowledge/entries.ts` ergänzen. Nur `reviewed` oder sichere `draft`/`low`-Einträge erscheinen im Assistenten.

**Keine Rechtsberatung, keine Medizinberatung, keine Fatwa** — bei individuellen Fragen Redirect auf Fachperson.

## Guided Fill-In (Phase 3C)

Geführter Ausfüllmodus unter `/dashboard/ausfuellen`:

| API | Beschreibung |
|-----|-------------|
| `POST /api/guided-flow/next` | Nächste Frage + Fortschritt |
| `POST /api/guided-flow/parse-answer` | Antwort → Vorschläge (ohne Auto-Save) |
| `POST /api/guided-flow/apply` | Bestätigte Updates anwenden |

24 priorisierte Fragen, rule-based Parser, Allowlist für Feldpfade. Fortschritt in LocalStorage.

## AI Companion (Phase 3A)

### Provider-Modi

| Modus | Env | Kosten | API-Key |
|-------|-----|--------|---------|
| **rules** (Default) | `AMANAH_AI_PROVIDER=rules` | Keine | Nein |
| **mock** | `AMANAH_AI_PROVIDER=mock` | Keine | Nein |
| **openai** | `AMANAH_AI_PROVIDER=openai` + `OPENAI_API_KEY` | Extern | Ja (nur Server) |

```env
AMANAH_AI_PROVIDER=rules          # mock | rules | openai
AMANAH_AI_ENABLED=true            # false deaktiviert KI-Routen
AMANAH_AI_MODEL_FAST=             # optional, z.B. gpt-4o-mini
AMANAH_AI_MODEL_SMART=            # optional für komplexere Aufgaben
OPENAI_API_KEY=                   # nur serverseitig, nie im Frontend
```

Ohne API-Key funktionieren **mock** und **rules** vollständig — Build und App laufen sofort.

### KI-Funktionen

| API | Beschreibung |
|-----|-------------|
| `POST /api/ai/next-question` | Wichtigste Lücke + nächste Frage |
| `POST /api/ai/completion-review` | Priorisierte offene Punkte |
| `POST /api/ai/extract` | Freitext → Feldvorschläge (nicht auto-gespeichert) |
| `POST /api/ai/family-message` | Familiennachricht-Entwurf |
| `POST /api/ai/knowledge` | Einfache Wissensfragen mit Disclaimer |
| `GET /api/ai/status` | Provider-Status + Consent-Hinweis |

### Datenschutz & Sicherheit

- **Keine Fatwa, keine Rechtsberatung, keine Medizinberatung**
- Externe KI (OpenAI) nur nach **Nutzer-Einwilligung** im UI
- Datenminimierung: nur nötige Felder pro Funktion
- Keine KI-Aufrufe bei Autosave — nur bei expliziter Nutzeraktion
- Safety Guardrails blockieren verbotene Fragestellungen

### Legacy Chat

`POST /api/ai` — Freier Chat (Mock/Rules/OpenAI mit Consent)

## AI Provider (Legacy)

### Mock / Rules (Default)

Regelbasierte und Mock-Antworten aus der lokalen Knowledge Base. Funktioniert ohne API Key.

### OpenAI (Optional)

```env
AMANAH_AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AMANAH_AI_MODEL_FAST=gpt-4o-mini
```

Der Amanah-Assistent:
- Nutzt **nur geprüfte Knowledge-Base-Inhalte** für islamische Fragen
- Nennt **immer Quellen**
- Gibt **keine Fatwa**, keine Rechtsberatung, keine Medizinberatung
- Bei Unsicherheit: „Das muss mit Imam/Gelehrten geprüft werden."

## Knowledge Base & Quellenpflicht

Strukturierte Wissensbasis unter `src/lib/knowledge/`:

- `sources.ts` — IslamicSource Datenmodell
- `janazah.ts`, `kulturfilter.ts`, `barzakh.ts`, `testament-erbe.ts`, etc.

**Regel:** Keine islamische Aussage ohne Quelle.

Jeder Eintrag hat:
- `sourceIds` — Referenzen zu Quran, Hadith, Fiqh, offiziellen Quellen
- `reviewStatus` — `draft` | `needs_scholar_review` | `reviewed`
- UI-Badge „In fachlicher Prüfung" bei unverifizierten Quellen

## Mehrsprachigkeit

i18n-Struktur unter `src/lib/i18n/`:
- Primär: Deutsch
- Vorbereitet: Englisch, Türkisch, Arabisch (RTL), Bosnisch, Albanisch
- Language Switcher in der Navigation
- KI-Übersetzung im Assistenten

## Tests & Checks

```bash
npm run test        # Vitest Unit Tests
npm run lint        # ESLint
npm run build       # Production Build
npm run check       # Alle Checks
```

## Sicherheit & Disclaimer

- **Keine Fatwa, keine Rechtsberatung, keine Medizinberatung**
- Sensible Daten nur lokal gespeichert
- Keine Passwörter in der App
- Roadmap: Ende-zu-Ende-Verschlüsselung (Phase 3)
- Spenden über Gemeinsam1 e.V. — keine Provision durch AmanahOrdner

## Deployment

```bash
npm run build
npm start
```

Empfohlen: Vercel, mit Environment Variables aus `.env.example`.

## Roadmap

### Phase 1 — MVP (aktuell)
- Landing, Wissen, Check, Dashboard, Module
- Print/PDF, Mock-AI, Mock-Bestatter, Mock-Gemeinsam1
- Lokale Speicherung, JSON Export/Import
- Knowledge Base mit Quellenpflicht

### Phase 2
- Auth, echte DB (Postgres/Prisma)
- Echte PDF-Erzeugung, Stripe/Zahlungen
- Admin, echte Partner-Listings
- Gemeinsam1 API, RAG Knowledge Base
- Vollständige Mehrsprachigkeit

### Phase 3
- PWA/App, QR-Notfallzugang
- Verschlüsselte Dokumentenablage
- Partner-Dashboard, Moschee-QR-Pakete
- Fachprüfungsworkflow mit Imam/Anwalt

## Lizenz

Privates Projekt — AmanahOrdner / sonjasungur.
