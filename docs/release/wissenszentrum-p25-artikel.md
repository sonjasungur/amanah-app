# Wissenszentrum P2.5-E: vollständige Artikel A–F (Redaktionsentwürfe)

Stand 18.11.2026. **Status aller 26 Artikel: Entwurf (DRAFT), ungeprüft, nicht veröffentlicht.** Es gibt keinen Weg zur Veröffentlichung: `isFullArticlePublishable` ist immer `false`. Eine Veröffentlichung braucht drei Dinge:
- dokumentierte Prüfungen durch qualifizierte islamische Fachpersonen,
- bei Abschnitten zum deutschen Recht zusätzlich eine juristische Prüfung,
- eine eigene Entscheidung der Betreiberin.

Bestandene automatische Prüfungen sind **keine** Freigabe.

## Wo die Artikel liegen und wer sie lesen kann

- **Daten:** `src/modules/islamic-knowledge/full-articles/p25-drafts.json`, Typen und Regeln in `full-articles/index.ts`.
- **Lesen:**
  - Nur in der internen Redaktionsansicht `/wissen/redaktion/artikel` und `/wissen/redaktion/artikel/<id>`, mit 8 Teilen je Artikel.
  - Erreichbar nur bei `NODE_ENV=development` oder `AMANAH_INTERNAL_TOOLS=true`. Auf Staging und in Produktion liefern die Seiten 404 (Browsertest `knowledge-center.spec.ts`).
  - `robots: noindex`; `/wissen/redaktion` ist in `robots.txt` gesperrt.
- **Schutz durch Tests** (`src/__tests__/p25-knowledge.test.ts`):
  - Kein Entwurf erscheint in `getPublishedArticles`, in der Sitemap oder unter `/wissen/islam/*`.
  - Nur die beiden internen Seiten importieren die Entwürfe, keine Client-Datei.
  - Alle Entwürfe sind DRAFT, ohne erfasste Prüfung und nicht veröffentlichbar, auch wenn Prüfungen vollständig erfasst wären.

## Aufbau je Artikel (8 Teile)

1. **Einleitung**
2. **Qur'an:** Wortlaut Bubenheim & Elyas über QuranEnc, unverändert, mit arabischem Text und Link.
3. **Tafsir Ibn Kaṯīr:** eigene, als „Zusammenfassung (Entwurf)“ gekennzeichnete Wiedergabe des arabischen Textes. Kein Zitat der deutschen Verlagsausgabe. Band und Seite trägt der Prüfer am Druckexemplar nach.
4. **Sunnah:** nur Sahih al-Bukhari und Sahih Muslim. Je Stelle Sammlung, Nummer, Erzähler, eigene Zusammenfassung, Erklärung und Zusammenhang.
5. **Unterschiedliche Auffassungen:** nur, wo belegt. Sonst als offen markiert.
6. **Praktische Bedeutung** für Muslime in Deutschland.
7. **Bedeutung für Amanah**, dazu „Deutsches Recht“ getrennt und als juristisch zu prüfen markiert.
8. **Quellen und Prüfstatus:** erforderliche Prüfungen, Liste „Von Hand zu prüfen“, offene Fragen.

## Artikel

| Bereich | Titel | id | Verse | Tafsir | Hadithe Bukhari/Muslim | offene Fragen | dt. Recht | Auffassungen |
|---|---|---|---|---|---|---|---|---|
| A | Die Erbverse 4:11, 4:12 und 4:176 | `p25-a-erbverse` | 3 | 3 | 4/0 | 6 | – | ja |
| A | Islamisches Erbrecht: Grundlagen, Reihenfolge und Rechte der Erben | `p25-a-grundlagen` | 3 | 3 | 2/1 | 5 | ja | ja |
| A | Häufige Missverständnisse und Unterschiede der Rechtsschulen | `p25-a-missverstaendnisse-rechtsschulen` | 2 | 3 | 2/1 | 5 | ja | ja |
| A | Schulden des Verstorbenen | `p25-a-schulden` | 4 | 3 | 3/2 | 6 | ja | ja |
| A | Waṣiyya und die Ein-Drittel-Regel | `p25-a-wasiyya` | 4 | 3 | 6/1 | 5 | ja | ja |
| B | Kranke besuchen und Sterbende begleiten | `p25-b-begleitung-sterbender` | 5 | 1 | 5/3 | 4 | ja | offen |
| B | Geduld, Trauer und Beileid | `p25-b-geduld-trauer-beileid` | 5 | 2 | 6/3 | 4 | – | ja |
| B | Den Tod bedenken und mit schwerer Krankheit umgehen | `p25-b-krankheit-tod` | 4 | 1 | 4/1 | 4 | ja | offen |
| B | Die ersten Stunden nach dem Tod | `p25-b-nach-dem-tod` | 2 | 1 | 4/2 | 3 | ja | offen |
| C | Angehörige im Trauerfall | `p25-c-angehoerige` | 4 | 4 | 7/2 | 5 | ja | ja |
| C | Beisetzung und Besuch des Grabes | `p25-c-beisetzung-friedhof` | 2 | 2 | 4/9 | 7 | ja | ja |
| C | Ghusl und Kafan | `p25-c-ghusl-kafan` | 0 | 0 | 7/6 | 6 | ja | ja |
| C | Salāt al-Janāza | `p25-c-salat-al-janaza` | 1 | 1 | 6/6 | 5 | – | ja |
| C | Vorbereitung der Janāza | `p25-c-vorbereitung` | 1 | 1 | 2/2 | 4 | ja | ja |
| D | Persönliche Wünsche festhalten | `p25-d-persoenliche-wuensche` | 2 | 2 | 4/1 | 3 | ja | offen |
| D | Schulden und anvertraute Güter dokumentieren | `p25-d-schulden-amana` | 3 | 3 | 3/0 | 5 | ja | ja |
| D | Testament und Waṣiyya: schriftlich vorsorgen | `p25-d-testament-wasiyya` | 4 | 4 | 8/2 | 5 | ja | ja |
| D | Verantwortung für Familie und minderjährige Kinder | `p25-d-verantwortung-kinder` | 3 | 3 | 5/0 | 4 | ja | offen |
| E | Wann anwaltlicher oder notarieller Rat nötig ist | `p25-e-anwalt-notar` | 3 | 1 | 1/0 | 4 | ja | offen |
| E | Islamische Bestattung in Deutschland | `p25-e-bestattung-deutschland` | 2 | 2 | 1/0 | 5 | ja | ja |
| E | Islamisches und deutsches Erbrecht | `p25-e-erbrecht-vergleich` | 2 | 1 | 3/0 | 4 | ja | offen |
| E | Testament errichten und internationale Erbfälle | `p25-e-testament-form-international` | 2 | 2 | 1/0 | 5 | ja | offen |
| F | Barzakh | `p25-f-barzakh` | 5 | 3 | 4/1 | 2 | – | offen |
| F | Bittgebete für Verstorbene | `p25-f-bittgebete-verstorbene` | 5 | 1 | 1/5 | 4 | – | offen |
| F | Rechenschaft und Verantwortung | `p25-f-rechenschaft` | 8 | 2 | 3/1 | 2 | ja | offen |
| F | Was nach dem Tod weiterwirkt: Sadaqa Jāriya und nützliches Wissen | `p25-f-sadaqa-jariya-wissen` | 3 | 1 | 5/3 | 4 | ja | offen |

**Summe:** 82 Qur'an-Stellen, 53 Tafsir-Zusammenfassungen, 153 Hadith-Verweise, 116 offene Fragen. Die 44 bestehenden Einträge bleiben unverändert. Welche davon ein Artikel bündelt, steht in `replacesExisting`. Alle Verweise sind im Katalog vorhanden (Test).

## Prüfergebnisse (automatisch und Stichprobe; keine Freigabe)

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| Qur'an-Wortlaut gegen QuranEnc neu abgerufen (18.11.2026) | 82/82 zeichengleich | `node scripts/knowledge/verify-p25-articles.mjs` |
| Qur'an gegen den bestehenden Wortlautspeicher (P2.3) | gleich, wo vorhanden | Unit-Test |
| Hadith-Nummern im offenen Spiegel (fawazahmed0/hadith-api) neu abgerufen | 153/153 vorhanden | dasselbe Skript |
| Hadith-Inhalt, Stichprobe 11 Stellen (Zusammenfassung gegen Spiegeltext) | 11/11 sinngemäß richtig | manuell, 18.11.2026 |
| Andere Sammlungen | nur als ausdrücklich „nicht verwendet“ erwähnt oder als Inhalt des Tafsir | Textscan |
| Tafsir- und Hadith-Texte als „Zusammenfassung (Entwurf)“ gekennzeichnet | alle | Unit-Test |
| Erfundene Band- oder Seitenangaben | keine | Textscan |

## Was nur Menschen prüfen können (vor jeder Freigabe)

- **Gelehrte:** Inhalt, Einordnung und Gewichtung aller Artikel. Unterschiedliche Auffassungen in 12 Artikeln sind „offen“.
- **Hadithe:**
  - Alle 153 von Hand auf sunnah.com prüfen. Automatische Abrufe sind dort gesperrt (403).
  - Muslim-Nummern mit Buchstaben (z. B. 939a) sind aus dem Spiegel abgeleitet.
  - Bukhari 5641 und 1241 fasst der Spiegel jeweils mit der Folgenummer zusammen.
  - Muslim 963.01 fehlt im Spiegel, verwendet wurde 963.02.
- **Tafsir:** Zusammenfassungen am Druckexemplar Ibn Kaṯīr (Dār Ṭayba) prüfen und Band und Seite ergänzen. Bei langen Abschnitten (2:180, 2:282, 4:6, 4:58, 5:106) wurde nur der erste Teil gelesen.
- **Juristen:** Abschnitte „Deutsches Recht“ in 21 Artikeln. Die Normangaben stammen aus dem Modellwissen und sind ungeprüft.
- **Bittgebete:** Den arabischen Wortlaut liefert nur der Spiegel. Die deutsche Wiedergabe ist eigener Entwurf.
- **Lücken:**
  - Rechenbeispiele (A) nur teilweise.
  - Kein eigener Artikel zu FAQ (folgt aus den Artikeln) und Bestattungsrecht (braucht Juristen; Hinweise in E).
  - Sadaqa Jāriya steht nur in F, um Doppelungen zu vermeiden.

## Offene Freigaben

| Freigabe | Wer | Stand |
|---|---|---|
| Religiöse Prüfung je Artikel | qualifizierte islamische Fachperson (Name, Qualifikation, Datum) | offen |
| Quellenprüfung je Artikel (sunnah.com, Druckexemplar Tafsir) | Redaktion | offen |
| Juristische Prüfung „Deutsches Recht“ | Rechtsanwalt oder Notar | offen |
| Entscheidung über Veröffentlichung und Ersatz bestehender Einträge | Betreiberin | offen |
| Optional: schriftliche Bestätigung der QuranEnc-Nutzung | Betreiberin | offen |
