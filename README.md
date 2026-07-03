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
| `AI_PROVIDER` | `mock` oder `openai` | `mock` |
| `OPENAI_API_KEY` | OpenAI API Key | — |
| `OPENAI_MODEL` | OpenAI Modell | `gpt-4o-mini` |
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

## AI Provider

### Mock (Default)

Hochwertige Mock-Antworten aus der lokalen Knowledge Base. Funktioniert ohne API Key.

### OpenAI (Optional)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
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
