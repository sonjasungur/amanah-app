# Islamisches Wissenszentrum (Sadaqa Jāriya) – Bestandsaufnahme, Struktur, technische Vorbereitung

Stand: 2026-10-30 · Branch `feat/vorsorge-testament-foundation` · **uncommitted, nicht deployt**
Ergänzt [00-abschlussbericht.md](00-abschlussbericht.md). Quellenprüfung im Detail: [05-quellenpruefung.md](05-quellenpruefung.md).
Keine Fatwa, keine Rechtsberatung. Belege: **[geprüft]** = in dieser Sitzung ausgeführt/gelesen.

---

## 1. Bestandsaufnahme des vorhandenen Wissensbereichs [geprüft]

### 1.1 Vorhandene Inhalte

| Quelle im Code | Inhalt | Anzahl | Bisherige Anzeige |
|---|---|---|---|
| `src/lib/knowledge/wissen-topics.ts` | Praxis-Topics (Janazah, Notfall, Vollmacht, Testament …) mit Checklisten | 14 | `/wissen` – **gefiltert** auf `reviewed` → alle 14 `needs_scholar_review` → Hub zeigte „Wissensbereich in Vorbereitung“, `/wissen/[slug]` erzeugte keine Seite |
| `janazah.ts`, `ghusl-kafan.ts`, `barzakh.ts`, `testament-erbe.ts`, `sadaqa-jariya.ts` | Religiöse Kurzartikel | 21 | `/janazah-kompass`, `/barzakh`, `/testament-erbe`, `/sadaqa-jariya` – **ungefiltert, ohne Prüfhinweis** |
| `kulturfilter.ts` | „Islam oder Kultur?“-Karten | 10 | `/islam-oder-kultur` – ungefiltert |
| Seiten-JSX | fest verdrahtete religiöse Aussagen (z. B. „Mehr als ein Drittel erfordert die Zustimmung aller Erben“) | 3 Blöcke | ungefiltert |
| `patientenverfuegung.ts` | Rechts-/Medizinhinweise (nicht religiös) | 4 | `/patientenverfuegung` |
| `entries.ts` | KI-Wissensbasis (Praxis) | 14 | nur KI-Assistent (standardmäßig aus) |
| `sources.ts`, `quran-verses.ts` | Quellen-Records | 20 + 4 Aliase | in Artikeln und Startseite (Muslim 1631) |

**Kernbefund:** Zwei widersprüchliche Veröffentlichungswege. Der neue Hub war vollständig gesperrt, die älteren Themenseiten veröffentlichten dieselbe Art ungeprüfter religiöser Aussagen ohne jeden Hinweis (im ausgelieferten HTML 0 Prüf-Badges).

### 1.2 Freigabestatus

- Vorhanden: `reviewStatus` = `draft | needs_scholar_review | reviewed`. **Kein Prüfer, kein Datum, keine Version** am Datensatz.
- 5 religiöse Einträge waren als `reviewed` markiert, ohne Beleg der Prüfung; einer davon ohne jede Quelle (`barzakh-forgiveness`), einer mit falscher Quelle (`erbe-deutschland` zitiert die Vorsorgevollmacht-Seite für Erbrecht). `entries.ts` setzt pauschal `lastReviewedAt: "2026-07-01"`.
- Diese Markierungen werden **nicht** als Freigabe übernommen, nur als `legacy.claimedStatus` dokumentiert.

### 1.3 Korrektheit der Qur'an- und Hadith-Referenzen

Automatisierte Gegenprüfung (QuranEnc `german_bubenheim`, Hadith-Spiegel der sunnah.com-Nummerierung, URL-Abrufe), Details in Dokument 05:

| Ergebnis | Anzahl |
|---|---|
| korrekt | 4 (Bukhari 1315/Muslim 944c, Muslim 1631, Bukhari 2742/Muslim 1628a, Gemeinsam1-Link) |
| Korrektur nötig | 16 |

Schwerwiegend:

1. **Qur'an 4:11 inhaltlich falsch**: Der hinterlegte Text sagt sinngemäß, Söhne und Töchter erben gleich. Bubenheim/Elyas: dem Männlichen so viel wie der Anteil von zwei Weiblichen. Trotzdem als lizenzierte, nicht umformulierte Übersetzung ausgewiesen.
2. Keiner der 7 Qur'an-Texte ist wörtlich Bubenheim/Elyas, alle tragen `isParaphrase: false`.
3. 3 Hadith-Nummern zeigen auf einen anderen Hadith (Bukhari 1254, 1273, 2738); Bukhari 2289 ungenau wiedergegeben.
4. 2 Fiqh-Quellen ohne Werk/Band/Kapitel; 3 Behörden-URLs liefern 404.
5. Mehrere Kulturfilter-Karten zitieren korrekte Hadithe, die das Gesagte **nicht** belegen (z. B. Hadith zum Beschleunigen der Janāza als Beleg gegen Gedenktage).
6. Das ältere Audit `docs/content-source-audit.md` (14.07.) stuft alles als korrekt ein – nicht haltbar.

Die Texte wurden **nicht** selbst korrigiert: Qur'an- und Hadith-Wortlaut sollen aus der lizenzierten Quelle übernommen und fachlich abgenommen werden (Lizenzfrage Bubenheim/Elyas ist offen).

### 1.4 Wiederverwendbare Komponenten

`SourcesSection`, `PrimarySourceCard` (Qur'an/Hadith-Karten mit Übersetzer und Link), `ReviewStatusBadge`, Quellenmodell `IslamicSource` (Typ, Fundstelle, Übersetzer, Paraphrase-Kennzeichen, Sammlung/Nummer), Dedupe gleicher Überlieferungen, `RichArticleCard`, Wissen-Hub-Layout mit Suche und Sidebar, Druck-CSS (`.no-print`), `isInternalToolsEnabled()`.

### 1.5 Was für ein öffentliches, kostenloses Portal fehlte

Prüfer/Datum/Version je Freigabe, ein einziges Veröffentlichungstor, Rechtsprüfung als eigene Stufe, Gradierungsfeld für Hadithe außerhalb Bukhari/Muslim, Themenstruktur A–E, SEO-Artikelseiten, Teilen/Drucken, Redaktionsansicht, Verknüpfung mit Vorsorgemodulen, Lesezeichen, versionierte Inhalte.

---

## 2. Themenstruktur (umgesetzt in `src/modules/islamic-knowledge/structure.ts`)

| Bereich | Unterthemen | Davon mit übernommenem Entwurf |
|---|---|---|
| A Islamisches Erbrecht (Farāʾiḍ) | 10 | 4 |
| B Tod und Sterben im Islam | 6 | 3 |
| C Janazah und islamische Bestattung | 9 | 4 |
| D Islamische Vorsorge | 7 | 3 |
| E Islamische Lehre und deutsches Recht (**juristische Prüfung Pflicht**) | 7 | 2 |

34 Bestandseinträge übernommen (21 Artikel, 10 Kulturfilter-Karten, 3 Seitentexte wortgleich). Status: 30 `SOURCE_REVIEW`, 4 `DRAFT` (ohne Quellen). 19 sind zusätzlich durch Quellenbefunde gesperrt. 23 Unterthemen haben noch keinen Inhalt.

---

## 3. Prüf- und Freigabeprozess (umgesetzt in `workflow.ts`)

`DRAFT → SOURCE_REVIEW → SCHOLAR_REVIEW → APPROVED → PUBLISHED`, jederzeit zurück nach `DRAFT`.

Öffentlich ist ein Artikel nur, wenn **alle** Bedingungen erfüllt sind (`isPublishable`):

1. Status `PUBLISHED`.
2. Mindestens eine Quelle.
3. Keine zitierte Quelle mit offenem Befund im Prüfregister (`source-verification.ts`); unbekannte Quellen gelten als ungeprüft.
4. Dokumentierte Quellen- **und** Gelehrtenprüfung – bei Bereich E bzw. Rechtsbezug zusätzlich juristische Prüfung – jeweils mit Name, Datum und für die **aktuelle Version**. Eine neue Version braucht neue Prüfungen.

Alle öffentlichen Wege nutzen dieses eine Tor: Hub `/wissen`, Artikelseite `/wissen/islam/[slug]`, die fünf früheren Themenseiten, Suche, „Verwandte Artikel“ und die Modul-Verknüpfungen.

---

## 4. Technische Umsetzung auf dem Branch

| Datei | Zweck |
|---|---|
| `src/modules/islamic-knowledge/types.ts` | Artikel, Prüfnachweise, Bereiche, Herkunft |
| `structure.ts` | Bereiche A–E mit Unterthemen |
| `catalog.ts` | Bestand referenziert (nicht umgeschrieben), Aliase normalisiert, Seitentexte wortgleich gesichert |
| `workflow.ts` | Statusübergänge, Pflichtprüfungen, `isPublishable` |
| `source-verification.ts` | Prüfregister mit den Befunden vom 30.10. |
| `publication.ts` | veröffentlichte Artikel, Volltextsuche (diakritik-tolerant), verwandte Artikel, Abdeckung, Redaktionsliste |
| `src/app/wissen/islam/[slug]/page.tsx` | SEO-Artikelseite (SSG, Metadaten, Canonical, OpenGraph), Prüfer + Datum + Version, getrennter Kasten „Deutsches Recht“, „Unterschiedliche Auffassungen“, Quellen, Teilen/Drucken |
| `src/app/wissen/redaktion/page.tsx` | interne Prüfansicht aller Entwürfe mit fehlenden Prüfungen und Quellenbefunden – nur mit `AMANAH_INTERNAL_TOOLS=true` bzw. in Entwicklung, sonst 404 |
| `src/components/islamic-knowledge/*` | Bereichsübersicht, Gate für Themenseiten, Teilen/Drucken, Modul-Verknüpfung |
| `/wissen` | Abschnitt „Islamisches Wissenszentrum“ oben, Suche schließt veröffentlichte Artikel ein; Titel „Islamisches Wissen“ |
| `/janazah-kompass`, `/barzakh`, `/testament-erbe`, `/islam-oder-kultur`, `/sadaqa-jariya` | zeigen nur noch Veröffentlichtes; **Mock-Spendenprojekte mit erfundenen Sammelständen entfernt** (Daten-Datei bleibt) |
| Startseite (Akhira-Sektion) | drei tote Links auf unveröffentlichte `/wissen/…`-Slugs ersetzt |
| `/dashboard/testament`, `/dashboard/schulden-amanah` | „Kostenloses Wissen dazu“ – erscheint erst, wenn passende Artikel veröffentlicht sind |
| Navigation | „Wissen“ → „Islamisches Wissen“ (DE/EN) |
| Tests | `src/__tests__/islamic-knowledge.test.ts` (16 Tests); 2 Text-Pins in bestehenden Tests angepasst |

Prüfergebnisse [geprüft]: Vitest 26 Dateien, **385 bestanden**, 1 skipped; `tsc` ok; ESLint 0 Fehler; Produktionsbuild ok; HTTP-Smoke-Test: `/wissen` 200 mit Bereichsübersicht, Themenseiten 200 ohne ungeprüfte Aussagen und ohne Sammelstände, `/wissen/islam/fara-id` 404, `/wissen/redaktion` 404 in Produktion. Playwright/visuelle Prüfung: `NOT_RUN`.

Bewusst **nicht** umgesetzt:

- Korrektur von Qur'an-/Hadith-Texten (benötigt lizenzierte Vorlage und fachliche Abnahme).
- Persistente Speicherung und Bearbeitung der Artikel in der Datenbank (CMS). Heute liegen Artikel als versionierte TypeScript-Daten im Repo; Freigaben sind damit über Git nachvollziehbar. Für ein Redaktionsteam ohne Entwickler ist ein DB-gestütztes Backend nötig (Datenmodell unten).
- Lesezeichen für angemeldete Nutzer (Feld im Ordner-Schema + Migration).
- KI-Wissenssuche.

---

## 5. Datenmodell für ein Redaktions-Backend (Vorschlag, nicht migriert)

```prisma
model KnowledgeArticle  { id, slug @unique, area, subtopicId, status, currentVersion Int, requiresLegalReview Boolean, createdAt, updatedAt }
model ArticleVersion    { id, articleId, version Int, title, summary, body, differingOpinions?, germanLawNote?, createdBy, createdAt }  // unveränderlich
model ArticleSourceRef  { articleVersionId, sourceId, locator? }
model Source            { id, type, collection?, number?, reference, translationName?, translationText?, isParaphrase, grading?, gradingBy?, url?, checkStatus, checkedAt }
model Review            { id, articleVersionId, kind (source|scholar|legal), reviewerId, decision, note?, reviewedAt }
model Reviewer          { id, name, qualification, role (editor|scholar|lawyer), active }
model Bookmark          { userId, articleId, createdAt }
```

Regeln: Veröffentlichen nur per deterministischer Prüfung wie `isPublishable`; jede Änderung erzeugt eine neue Version und setzt den Status auf `DRAFT`; Prüfer-Rollen getrennt; Audit-Log je Statuswechsel.

---

## 6. KI-Wissenssuche (später, Leitplanken)

- Nur Retrieval über **veröffentlichte** Artikel (`getPublishedArticles`), nie über Entwürfe oder `entries.ts`.
- Antwort nur als Auszug mit Quellenliste; ohne passenden Treffer ausdrücklich: „Dazu gibt es noch keinen geprüften Artikel.“
- Keine Fatwas, keine eigenen Urteile, keine Hadith-Zitate außerhalb des Quellenregisters.
- Bestehende KI-Schicht (`src/lib/ai`, `src/lib/knowledge/grounded-answer.ts`) ist dafür wiederverwendbar; heute greift sie noch auf `entries.ts` zu, deren `reviewed`-Markierungen ebenfalls unbelegt sind → vor Aktivierung umstellen.

---

## 7. Nächste Schritte (Priorität)

| Prio | Schritt | Wer |
|---|---|---|
| P0 | Lizenz/Nutzungsrecht Bubenheim/Elyas (oder andere Übersetzung) klären; Qur'an-Texte wörtlich übernehmen, 4:11 zuerst | Owner + Fachperson |
| P0 | Hadith-Referenzen korrigieren (1254→1325, 1273, 2738, 2289), Gradierungsfeld ergänzen | Entwicklung nach fachlicher Vorgabe |
| P0 | Redaktion benennen: Quellenprüfer, Gelehrte (welche Rechtsschulen?), Rechtsanwalt für Bereich E | Owner |
| P1 | Erste 5–10 Artikel je Bereich schreiben und durch den Prozess führen (Start: Farāʾiḍ-Grundlagen, Ghusl, Salāt al-Janāza, Schulden, Pflichtteil-Vergleich) | Redaktion |
| P1 | Behörden-Links ersetzen (BMJ-Ersatz-URLs in Dokument 05) | Entwicklung |
| P1 | Lesezeichen, `sitemap.xml`/strukturierte Daten für veröffentlichte Artikel | Entwicklung |
| P2 | DB-gestütztes Redaktions-Backend mit Rollen | Entwicklung |
| P2 | KI-Wissenssuche nach Abschnitt 6 | Entwicklung |
