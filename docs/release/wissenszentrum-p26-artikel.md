# Wissenszentrum P2.6: 28 Artikel (Version 2) und Quellenprüfung

Stand 18.11.2026.

**Status aller Artikel:** Entwurf (DRAFT), intern, nicht veröffentlicht. `isFullArticlePublishable` ist immer `false`.

Eine Veröffentlichung braucht:
- dokumentierte Prüfungen durch qualifizierte islamische Fachpersonen,
- bei deutschem Recht zusätzlich Juristen,
- eine eigene Entscheidung der Betreiberin.

Automatische und redaktionelle Prüfungen sind keine Freigabe.

## Was neu ist gegenüber P2.5

**Umfang:**
- 26 Artikel vollständig neu ausgearbeitet, mit 1.500–3.300 Wörtern zusammenhängendem Text je Artikel.
- 2 neue Artikel: `p26-c-faq` (15 häufige Fragen zu Janāza und Bestattung) und `p26-e-bestattungsrecht` (alle 16 Landesbestattungsgesetze mit amtlicher Fundstelle).
- Version 1 bleibt im Archiv: `src/modules/islamic-knowledge/full-articles/archive/p25-drafts-v1.json`.

**Absatzkategorien:**
- Jeder Absatz hat genau eine Kategorie: Einleitung, Erklärung, Qur'an, Tafsir, Hadith, Einordnung, Fiqh, Praxis, Amanah oder Recht.
- Quellenverweise gelten nur innerhalb der eigenen Quellenart. Verweise auf eine andere Art stehen gesondert als „siehe auch“ (Test).

**Prüfstand je Quelle** in sechs Stufen:

| Stufe | Wer sie setzt |
|---|---|
| Noch nicht überprüft | automatisch |
| Quellenstelle gefunden | automatisch |
| Wortlaut abgeglichen | automatisch |
| Inhalt und Kontext geprüft | automatisch oder redaktionell durch Claude (höchste Stufe, die Claude setzen darf) |
| Fachliche Freigabe offen | nur ein Mensch |
| Von der Betreiberin geprüft | nur ein Mensch |

„Quellenstelle gefunden“ bedeutet nie „inhaltlich geprüft“. Tafsir wird nie „wörtlich abgeglichen“, weil nicht zitiert wird.

## Quellen

**Qur'an:** ausschließlich Bubenheim & Elyas über QuranEnc (`german_bubenheim`, Version 1.1.5). Der Wortlaut wird per Skript übernommen, nicht abgetippt.

**Tafsir Ibn Kaṯīr:**
- Ausgabe: Dār Ṭayba, hg. Sāmī b. Muḥammad as-Salāma (2. Aufl. 1999), arabischer Text nach quran.ksu.edu.sa.
- Nur eigene Zusammenfassung, kein Zitat.
- Band und Seite sind online nicht angegeben, deshalb überall „offen“.
- Was Ibn Kaṯīr aus anderen Sammlungen anführt, ist nur als solches benannt und nie als Beleg verwendet.

**Sunnah:**
- Nur Sahih al-Bukhari und Sahih Muslim.
- Nummer, Erzähler und Inhalt im Spiegel `fawazahmed0/hadith-api` geprüft; der arabische Auszug ist unverändert übernommen.
- Muslim-Buchstaben (a, b …) sind aus dem Spiegel abgeleitet.
- sunnah.com sperrt automatische Abrufe. Die Prüfung dort steht für alle Stellen von Hand aus.

**Deutsches Recht:** nur amtliche Quellen (gesetze-im-internet.de, eur-lex.europa.eu, Landesrechtsportale), mit URL und Abrufdatum. Alles muss noch juristisch geprüft werden.

## Unabhängige Gegenprüfung

`node scripts/knowledge/build-p26-articles.mjs <Gruppenordner> <Hadith-Cache>` führt die Gruppenentwürfe zusammen und prüft dabei unabhängig:
- jeden Qur'an-Wortlaut live gegen QuranEnc,
- jede Hadith-Nummer und jeden arabischen Auszug gegen die vollständigen Spiegelausgaben.

Bei Abweichung setzt es die Stufe herab.

**Ergebnis vom 18.11.2026:**

| Quelle | Ergebnis |
|---|---|
| Qur'an | 130/130 zeichengleich |
| Hadith-Nummern | 282/282 gefunden |
| Arabische Auszüge | 282/282 wörtlich gefunden |

Keine Stufe musste herabgesetzt werden.

## Prüfbereich

`/wissen/redaktion/artikel` und `/wissen/redaktion/artikel/<id>`:
- nur mit `NODE_ENV=development` oder `AMANAH_INTERNAL_TOOLS=true`, auf Staging und in Produktion 404, `noindex`;
- Artikeltext mit Kategorie je Absatz;
- Quellenverzeichnis mit Ausgabe, Fundstelle, Link, Prüfstufe und Prüfweg;
- offene Fragen nach Gelehrten, Juristen und Redaktion getrennt; Liste „Von Hand zu prüfen“.

Die Betreiberin kann je Quelle „Von mir geprüft“ setzen. Das wird nur in ihrem Browser gespeichert und lässt sich als Datei exportieren. Es entsteht keine Serverspeicherung und keine Migration.

Prüfunterlagen als PDF entstehen über die Druckfunktion des Prüfbereichs.

## Tests

`src/__tests__/p26-knowledge.test.ts` prüft:
- alle Artikel sind DRAFT und nie veröffentlichbar;
- kein Import aus Browser-Code;
- keine öffentliche Route, keine Sitemap;
- Struktur, Kategorien und Stufen;
- Gegenprüfung vollständig;
- Qur'an gleich dem Wortlautspeicher;
- alle Unterthemen behandelt.
