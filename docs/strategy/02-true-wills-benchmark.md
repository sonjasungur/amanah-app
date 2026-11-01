# Phase B – Benchmark True Wills (UK) für Amanah (DE)

> **Korrekturen 01.11.2026:** siehe [Doku 32 §4](32-juristische-pruefpunkte.md) (§ 2260 BGB weggefallen, § 1783 BGB, Smartlaw-Maßstab) und [Doku 31 §2](31-produktparitaet-und-markteintritt.md) (Abo-Preisverlauf ungeklärt; Marketingkanäle ergänzt). Die Rohdaten unter `tw_raw/` existieren nicht mehr.

Recherche: 2026-10-30, nur lesend. Kein Konto angelegt, keine Formulare abgeschickt, kein Kontakt.
Zweck: Funktionsvergleich. Es wurden keine Texte, Designs oder Vorlagen übernommen. Beschreibungen
sind eigene Worte; einzelne kurze Zitate sind als „Zitat“ markiert.

Kennzeichnung:
- **[V]** = VERIFIZIERT: auf einer Seite gesehen, Quelle angegeben
- **[I]** = INFERIERT: eigene Annahme oder Schlussfolgerung, ungeprüft
- **[R]** = rechtlicher Hinweis zu DE. Allgemeine Einordnung, keine Rechtsberatung. Vor der Umsetzung
  durch eine Anwältin oder einen Anwalt bzw. ein Notariat prüfen lassen.

---

## 0. Wichtigste Einschränkung: Die Live-Seite ist nicht erreichbar

| Prüfung (2026-10-30) | Ergebnis |
|---|---|
| `https://truewills.co.uk/` (auch `www.`, `http://`) | **[V]** Weiterleitung auf `/cgi-sys/suspendedpage.cgi`, Seitentitel „Account Suspended“ (Hosting-Sperrseite). Geprüft mit `curl -L` und WebFetch. |
| `https://wills.truewills.co.uk/bismillah/start`, `/login` (Portal) | **[V]** TLS-Fehler: Das Zertifikat passt nicht zum Hostnamen. Die Seite wurde nicht geladen. |
| `truewills.com` | **[V]** TLS-Verbindungsfehler, nicht erreichbar. |
| App-Store- und Google-Play-Einträge | **[V]** Per Websuche keine True-Wills-App gefunden. Ein Treffer „I Will Islamic Inheritance App“ stammt von einem anderen Anbieter (ALZi LTD) und gehört nicht dazu. |
| Trustpilot `uk.trustpilot.com/review/truewills.co.uk` | **[V]** Profil vorhanden (laut Seite im Mai 2021 beansprucht), **0 Bewertungen**, kein TrustScore. |

**Folge:** Alle Produktangaben unten stammen aus öffentlich archivierten Snapshots der Wayback Machine
(web.archive.org). Live wurde davon nichts gesehen. Je Angabe ist der Snapshot-Zeitstempel genannt.

| Quelle | Snapshot |
|---|---|
| Startseite | `web.archive.org/web/20260612014635/https://truewills.co.uk/` |
| Preisseite `/create-an-islamic-will/` | `…/web/20251206021517/…` |
| FAQ `/faqs-on-islamic-wills/` | `…/web/20260512154153/…` |
| About `/about/` | `…/web/20260512155710/…` |
| AGB `/terms/` | `…/web/20260612011124/…` |
| Blog „How do you create an Islamic will online“ (Mai 2021) und „islamicwillportal“ (Apr. 2021) | Snapshots 2024 |
| Blog „Wassiyyah“ (Dez. 2020) und „Guardians of the galaxy“ (Jul. 2021) | Snapshots 2024 |
| Portal-App (React-Bundle) `wills.truewills.co.uk/static/js/main.3bbe7b09.chunk.js` | `…/web/20230214113308/…` (Benutzeroberflächentexte ausgewertet) |

**Status des Produkts:**
- **[V]** Wahed (Fintech) hat True Wills zusammen mit iWill Solicitors gekauft. Quelle: Legal Futures, 14.02.2023
  (https://www.legalfutures.co.uk/latest-news/islamic-fintech-company-buys-law-firm-specialising-in-shariah-wills).
  Das Portal-Bundle von 02/2023 nennt als Datum den 8. Februar 2023.
- **[V]** Das Portal-Bundle von 02/2023 enthält einen Hinweis: Wegen der Übernahme können vorübergehend keine
  neuen Testamente erstellt werden. Bestehende Nutzer können sich weiter anmelden. Für einen „bespoke service“
  verweist der Hinweis auf ein externes Formular.
- **[V]** Die Marketing-Seite zeigte bis zum Snapshot 06/2026 weiter Preise und den Aufruf „Let's begin“.
- **[I]** Wahrscheinlich war der Self-Service seit 2023 eingefroren und die Marketing-Seite nicht mehr aktuell.
  Heute ist die Domain gesperrt. True Wills ist damit ein **historischer Benchmark (Stand ca. 2021–2023)**,
  kein laufendes Produkt.
- **[V]** Nachfolgeangebot: „Wahed Wills“ unter https://wahed.com/uk/wills (abgerufen am 2026-10-30, Angaben
  laut WebFetch-Zusammenfassung). Expertengespräch £30, Online-Testament £125 (für Nachlässe unter £325.000),
  Bespoke-Testament ab £900. Die Testamente sollen laut Seite von Islamgelehrten und Experten für islamische
  Testamente geprüft sein. Zu Rechtsschulen (Madhab) und Verwahrung macht die Seite keine Angaben.
  Nur als Kontext; Wahed wurde nicht vertieft untersucht.

---

## 1. Funktionsanalyse True Wills

### 1.1 Einstieg und Registrierung
- **[V]** Der Einstieg „Let's begin“ führt ins Portal (`wills.truewills.co.uk/bismillah/start`). Zuerst
  kommen einige Eignungsfragen ohne Konto (Quelle: Portal-Bundle 02/2023):
  1. Wohnsitz in England oder Wales? Bei „Nein“ endet der Ablauf mit einer Absage.
  2. Liegt das gesamte Vermögen im Vereinigten Königreich? Bei „Nein“ erscheint ein Hinweis: Das Testament
     erfasst nur UK-Vermögen, für Auslandsvermögen braucht man ein im jeweiligen Land gültiges Testament.
     Danach geht es trotzdem weiter.
  3. Eine Seite mit dem Nutzen des Produkts, danach die Registrierung.
- **[V]** Ein Blogartikel von 05/2021 spricht von „5 simple questions“. Im Bundle von 2023 sind es weniger
  Fragen. **[I]** Der Ablauf wurde also gekürzt.
- **[V]** Vor dem eigentlichen Fragebogen ist ein Konto Pflicht: Name, gewünschte Anrede, E-Mail, Passwort
  (mindestens 10 Zeichen), Zustimmung zu den Bedingungen und ein optionales Marketing-Opt-in. Die Schaltfläche
  heißt „Pre-register for free“. Die E-Mail-Adresse muss bestätigt sein, bevor das Testament zur Prüfung
  eingereicht werden kann.
- **[V]** Kostenlos ist das gesamte Ausfüllen inklusive Vorschau. Bezahlt wird erst beim Einreichen zur
  Anwaltsprüfung (Startseite und Preisseite: „Begin for free“; Blog 05/2021: Vorschau vor der Zahlung).
- **[V]** Die Antworten werden automatisch gespeichert, man kann später weitermachen (Blog 05/2021).
- **[V]** Zahlung per Kredit- oder Debitkarte (Portal-Bundle). **[I]** Wahrscheinlich über Stripe, das legt
  der Code nahe.

### 1.2 Kostenloser Fragebogen
- **[V]** Das Portal-Dashboard zeigt Schritt-Karten mit Zeitangabe (Portal-Bundle 02/2023):
  - Schritt 1 „About you“ (3–4 Minuten)
  - Schritt 2 „Accounts and property“ (2–3 Minuten)
  - Schritt 3 „Executors and trustees“ (3–4 Minuten)
  - optional „Wasiyyah“ (2–4 Minuten), unterteilt in Charity, Gifts und Messages
- **[V]** Es gibt eine Fortschrittsanzeige. Als Gesamtdauer nennt das Produkt „ca. 15–20 Minuten“
  (Startseite, Portal).

### 1.3 Familie und Erben
- **[V]** Abgefragt werden (Portal-Bundle): vollständiger Name, Wunschname, Geburtsdatum, Geschlecht,
  Adresse, Telefon, Familienstand und Ehepartner, Kinder (mit Geburtsdatum), ob die Eltern leben, die vier
  Großeltern (väterlich und mütterlich), Anzahl der Geschwister, Söhne der Brüder, Vollbrüder des Vaters
  (Onkel väterlicherseits) und deren Söhne.
- **[I]** Die Abfrage folgt erkennbar der Fara'id-Logik: Koranerben plus männliche Restanspruchsberechtigte
  (`asaba`) bis zum Cousin väterlicherseits.
- **[V]** Für die Anteilsberechnung braucht True Wills keine Vermögensbeträge (FAQ, Startseite, Portal).
- **[V]** Nicht im Bundle gefunden: Auswahl einer Rechtsschule (Madhab), Fragen nach nicht-muslimischen
  Angehörigen, Adoptiv- oder Stiefkindern, Halbgeschwistern, Mutterbrüdern, Töchtern der Brüder usw.
  **[I]** Diese Fälle werden vermutlich entweder nicht abgedeckt oder in der Anwaltsprüfung bzw. im
  Telefonservice behandelt.

### 1.4 Vermögen
- **[V]** Vermögensarten zur Auswahl (Portal-Bundle): Bankkonto, Rente/Pension, Lebensversicherung,
  Aktien/Wertpapiere, Immobilie, Unternehmen, Gold und Silber.
- **[V]** Zu Immobilien wird gefragt: Adresse, Hypothek ja/nein, Eigentum (allein, gemeinsam oder „weiß nicht“).
- **[V]** Erfasst wird nur Vermögen im Vereinigten Königreich (siehe 1.1).
- **[V]** Die FAQ ordnet Lebensversicherungen als schariarechtlich problematisch ein und behandelt Fragen zur
  Erbschaftsteuer (IHT).
- **[I]** Beträge werden offenbar nicht abgefragt. Die Vermögensliste dient eher der Orientierung für die
  Testamentsvollstrecker als der Berechnung.

### 1.5 Vermächtnisse (Wasiyyah, Spenden, Einzelzuwendungen)
- **[V]** Bis zu einem Drittel des Vermögens kann an gemeinnützige Organisationen, Freunde oder nicht
  erbberechtigte Verwandte gehen. Das ist freiwillig (Startseite, FAQ, Portal).
- **[V]** Für Spenden gibt es ein Verzeichnis mit laut Seite über 1.000 in Großbritannien registrierten
  muslimischen Organisationen (FAQ). Laut AGB ist das Verzeichnis kostenlos, ohne Empfehlung und ohne Gewähr.
- **[V]** Begünstigte werden mit einem **Prozentanteil** erfasst, die Spende ebenfalls in Prozent; ein Betrag
  ist Pflicht (Validierung im Portal-Bundle).
- **[I]** Konkrete Einzelgegenstände (z. B. „Auto an X“) sind im Bundle nicht als eigener Typ erkennbar.
  Ob das System die Drittel-Grenze technisch begrenzt, ist im Bundle nicht eindeutig.
- **[V]** Der Blog (12/2020) erklärt die Drittel-Regel: Mehr als ein Drittel ist nur mit Zustimmung aller Erben
  möglich, und ein Vermächtnis an gesetzliche Erben soll nicht als Umgehung dienen.

### 1.6 Bestattungswünsche (Janazah)
- **[V]** Es gibt nur ein Freitextfeld für Nachrichten an die Familie, im Wasiyyah-Bereich unter „Messages“.
  Als Beispiele nennt die Seite die bevorzugte Moschee für das Totengebet und den Friedhof (FAQ, Startseite).
  Laut Portal wird der Text so übernommen, wie er eingegeben wird.
- **[I]** Eine strukturierte Abfrage (Waschung, Leichentuch, Fristen, Rückführung, Kontaktpersonen) gibt es
  offenbar nicht.

### 1.7 Vormund für minderjährige Kinder
- **[V]** Vormünder können für Kinder unter 18 benannt werden. Im Portal werden Personen angelegt und als
  Vormund verknüpft (Startseite, Blog 07/2021, Portal-Bundle).
- **[V]** Laut Blog (07/2021) steht die gewünschte islamische Erziehung allgemein formuliert im Testament.
  Mehrere Vormünder sowie unterschiedliche Vormünder je Kind sind möglich, der Blog bespricht die Folgen.
- **[V]** Laut FAQ ist ein Vormund im Ausland zwar eintragbar, kann aber an Einwanderungsfragen scheitern.

### 1.8 Testamentsvollstrecker und Treuhänder
- **[V]** Vollstrecker und Treuhänder sind aus Vereinfachung dieselben Personen. Empfohlen werden zwei
  volljährige Personen; Familie, Freunde und volljährige Kinder sind wählbar (FAQ, Portal).

### 1.9 Testamentserstellung und Erbquoten
- **[V]** Die Erbanteile nach Koran und Sunna berechnet True Wills selbst. Sie erscheinen als **Brüche** in
  einem „letter of wishes“, der dem Testament beiliegt (FAQ, Startseite, Portal).
- **[V]** Laut FAQ genügt ein Testament mit dem bloßen Satz „nach islamischem Recht verteilen“ nicht, weil
  englisches Recht islamisches Recht nicht anerkennt und das Testament zu unbestimmt wäre. Ein Testament mit
  einem Trust, bei dem die Treuhänder nach islamischem Recht verteilen, sei dagegen möglich.
- **[I]** Daraus folgt die wahrscheinliche Konstruktion: Der Nachlass geht in einen Trust, die Treuhänder
  haben Ermessen, und der Letter of Wishes mit den berechneten Brüchen lenkt dieses Ermessen.
- **[V]** Auf keiner Seite und im Portal-Bundle wird eine **Madhab-Auswahl** erwähnt (Suche nach
  „madh/hanaf/shafi/maliki/hanbali/shia/ja'fari/school“ ohne Treffer).
  **[I]** Welche Rechtsschule zugrunde liegt, ist unbekannt.
- **[V]** Das Dokument ist eine PDF-Datei, die auf dem Server erzeugt wird. Der Dateiname enthält Name und
  Datum (Portal-Bundle).

### 1.10 Prüfung durch Juristen
- **[V]** Die Prüfung durch eine **hausinterne Solicitor** ist im Preis enthalten. Sie dauert bis zu 7 Tage
  (das Portal sagt „7 working days“) (Startseite, Portal).
- **[V]** Die Mitgründerin bzw. der Mitgründer ist als UK-Solicitor ausgewiesen (laut Seite qualifiziert 2008).
  Die Startseite verlinkt ein Practising Certificate von 2021.
- **[V]** Statusablauf im Portal: eingereicht → in Prüfung → Änderung angefordert oder freigegeben →
  erneut einreichen.
- **[V]** Eine Prüfung durch **Islamgelehrte** wird bei True Wills nicht genannt; die Seite spricht von einer
  Solicitor, die auf englisches und islamisches Recht spezialisiert ist. (Erst das Nachfolgeangebot von Wahed
  wirbt mit Gelehrtenprüfung.)
- **[V]** Die AGB beschreiben zusätzlich: eine Erstberatung (E-Mail oder Telefon, bis 45 Minuten),
  Festpreisangebote und Mandate mit **externen, unabhängigen Anwälten**. Für diese Mandate gelten deren eigene
  Bedingungen. Die AGB verlinken dafür auf Mandatsbedingungen eines Drittanbieters (rocketlawyer.com).
  **[I]** Die AGB sind vermutlich aus einer Plattformvorlage abgeleitet.

### 1.11 Ausgabe, Unterschrift, Verwahrung
- **[V]** Ablauf: PDF herunterladen, ausdrucken, vor **zwei Zeugen** unterschreiben. Die Zeugen tragen ihre
  Daten ein und unterschreiben ebenfalls (Startseite, FAQ, Portal).
- **[V]** Beim Telefon-Testament wird das Dokument per E-Mail oder Post zugeschickt (Startseite).
- **[V]** Einen Verwahrungsdienst oder ein Register (physisch oder digital) erwähnt keine der untersuchten
  Seiten. Die FAQ-Frage zum Unterschreiben in Corona-Quarantäne und die Frage „Muss ein Solicitor
  unterschreiben?“ sind mit „Answer TBC“ unbeantwortet (FAQ, Snapshot 05/2026).
- **[I]** Ob es eine ausführliche Anleitung für die Zeugen gab (Unabhängigkeit, keine Begünstigten), ist auf
  den öffentlichen Seiten nicht belegt. Sie lag vielleicht dem PDF bei.

### 1.12 Änderungen und Abo
- **[V]** Im ersten Jahr sind unbegrenzte Änderungen kostenlos (Startseite, Preisseite, Portal).
- **[V]** Danach ist laut AGB (06/2026) ein optionales Abo für **£10 pro Jahr** buchbar. Die Zahlungsdaten
  werden gespeichert und zum Jahrestag belastet; Kündigung online oder per E-Mail; 14 Tage Widerrufsfrist.
  Hat man innerhalb der Frist schon eine Änderung genutzt, entfällt die Erstattung.
- **[V]** Blogartikel von 2021 nennen für dasselbe Abo **£20 pro Jahr**. **[I]** Der Preis wurde also gesenkt.
- **[V]** Nach jeder Änderung muss das Testament neu gedruckt und vor zwei Zeugen neu unterschrieben werden
  (FAQ). Laut Portal gilt: Eine Änderung wird erneut eingereicht und erneut geprüft.

### 1.13 Preise (wie in den Archiv-Snapshots angezeigt; live am 2026-10-30 nicht abrufbar)

| Paket | Preis | Inhalt laut Seite | Quelle |
|---|---|---|---|
| Online-Testament (als „Recommended“ markiert) | **£98** einmalig | Nachlass unter £350.000, Prüfung durch die Solicitor, Download in unter 7 Tagen, Support per Chat und Telefon | Preisseite 12/2025, Startseite 06/2026 |
| Telefon-Testament | **£148** | Erstellung am Telefon durch die Solicitor, kostenloser Rückruf | Preisseite 12/2025, FAQ der Startseite |
| Testament für große Nachlässe | **ab £350** | über £350.000, inklusive Erbschaftsteuer-Planung am Telefon | Preisseite 12/2025 |
| Änderungs-Abo ab dem 2. Jahr | **£10 pro Jahr** (2021: £20) | unbegrenzte Änderungen, optional | AGB 06/2026, Blog 2021 |
| Testamente für Paare oder Spiegeltestamente | – | **[V]** Kein Angebot sichtbar. Die FAQ empfiehlt Paaren getrennte Testamente. | FAQ |
| Vorsorgevollmacht (LPA), Verwahrung, weitere Zusatzleistungen | – | **[V]** Nicht angeboten bzw. nicht erwähnt | alle untersuchten Seiten |

Die Startseite gibt als Ersparnis gegenüber einer Kanzlei „über £200“ an.

### 1.14 UX auf Desktop und Mobilgeräten (soweit aus dem Seitenaufbau ablesbar)
- **[V]** Die Marketing-Seite läuft auf WordPress mit eigenem Theme und Utility-CSS mit Breakpoints
  (`xs/md/lg`). Sie hat ein Viewport-Meta-Tag, auf großen Bildschirmen eine mitlaufende („sticky“) Preisbox,
  FAQ-Akkordeons, einen Live-Chat-Knopf (Tawk), ein Rückrufformular, Social Links und einen Hadith-Banner
  oben auf der Seite.
- **[V]** Das Portal ist eine React-Single-Page-App mit Material-UI und einem Raster für `xs/sm/md`. Es zeigt
  Schritt-Karten mit Zeitangabe, eine Fortschrittsanzeige, Hinweis-Snackbars, Dialoge zum Hinzufügen von
  Personen und einen Bereich „Freunde einladen“ (persönlicher Link oder E-Mail, begründet mit religiösem
  Lohn). Im Code stecken Analytics-Ereignisse je Seite.
- **[I]** Die Oberfläche ist responsiv und ab Mobilgeräten nutzbar. Native Apps gibt es nicht.
  Tatsächliches Verhalten auf Geräten: NOT_RUN, weil die Live-Seite nicht erreichbar ist.

### 1.15 Regulierung und Haftung
- **[V]** In der Fußzeile steht sinngemäß: Online-Dienst für Rechtsformulare und Informationen, keine Kanzlei
  und kein Ersatz für anwaltliche Beratung bei komplexen Fällen.
- **[V]** Die AGB nennen True Wills Limited als Betreiberin (Companies-House-Nr. 12699039, Sitz in Milton
  Keynes). Sie sagen ausdrücklich: **keine regulierte Kanzlei**, die Kommunikation ist möglicherweise nicht
  durch das Anwaltsgeheimnis (Legal Professional Privilege) geschützt, es entsteht kein Mandatsverhältnis.
  Externe Anwälte **können** von der SRA reguliert sein. Für Fehler in den Eingaben der Nutzer wird nicht
  gehaftet.
- **[V]** Eine Berufshaftpflichtversicherung, eine Aufsicht für True Wills selbst oder ein Verband für
  Testamentsersteller werden nicht erwähnt.
- **[I]** Das passt zur UK-Lage: Testamentserstellung ist dort keine vorbehaltene Tätigkeit.

---

## 2. Vergleich: True Wills und was Amanah in Deutschland braucht

DE-Rechtslage nur als Orientierung **[R]**. Alle Punkte vor der Umsetzung juristisch prüfen lassen.

| Funktion | True Wills (UK) | Übertragbar? | Was Amanah (DE) braucht | Rechtlicher Unterschied UK ↔ DE |
|---|---|---|---|---|
| Kostenloser Einstieg vor der Registrierung | 2–3 Eignungsfragen, dann Konto Pflicht; Ausfüllen und Vorschau kostenlos | **Ja** | Kostenloser Orientierungs-Check (z. B. „Wer würde nach islamischen Regeln erben?“, ohne Konto). Konto erst beim Speichern. | – |
| Eignungsfilter (Gebiet, Vermögen im Ausland) | Nur England/Wales, nur UK-Vermögen | **Angepasst** | Filter nach gewöhnlichem Aufenthalt in DE, Staatsangehörigkeit(en), Auslandsimmobilien (z. B. in der Türkei, Marokko oder Syrien). Bei Auslandsbezug Hinweis auf Anwalt bzw. Notar. | **[R]** EU-Erbrechtsverordnung: Grundsätzlich gilt das Recht des letzten gewöhnlichen Aufenthalts; eine Rechtswahl zugunsten des Heimatrechts ist möglich (Art. 22). Bei Anwendung ausländischen Rechts ist der deutsche ordre public zu beachten (Art. 35), z. B. bei Ungleichbehandlung nach Geschlecht oder Religion. Auslandsimmobilien unterliegen oft fremden Formvorschriften. |
| Familien- und Erbenerfassung | Fara'id-orientiert bis Cousin väterlicherseits, keine Beträge nötig | **Ja (Logik)** | Vollständigeres Modell: Halbgeschwister, Adoptiv- und Stiefkinder, nicht-muslimische Angehörige, vorverstorbene Kinder mit Enkeln, mehrere Ehefrauen (Auslandsehen). Zusätzlich die **deutsche gesetzliche Erbfolge** parallel berechnen. | **[R]** Nach deutschem Recht erben Söhne und Töchter gleich, Ehegatten bekommen ihren Anteil nach §§ 1931, 1371 BGB, auch nicht-muslimische Angehörige erben. Adoptivkinder sind leiblichen gleichgestellt. |
| Islamische Erbquoten | Automatische Brüche im Letter of Wishes; keine Madhab-Auswahl sichtbar | **Teilweise** | Rechner mit Madhab-Auswahl (mindestens hanafitisch; ggf. schafiitisch, malikitisch, hanbalitisch, ja'faritisch), Erklärung der Quellen, ausdrücklich als **Information** gekennzeichnet. Grenzfälle wie Awl/Radd sichtbar machen. Gelehrtenprüfung der Regeln vorsehen. | **[R]** In DE kann die islamische Verteilung durch Erbeinsetzung zu Quoten im Testament umgesetzt werden (Testierfreiheit). Der englische Umweg über Trust plus Letter of Wishes ist dafür nicht nötig und wäre in DE ungeeignet: Einen Trust kennt das deutsche Recht so nicht, ein „Letter of Wishes“ ist nicht bindend. |
| Pflichtteil (Zwangsanteil) | In UK nicht relevant (dort nur Ansprüche nach dem Inheritance Act 1975) | **Nein (neu nötig)** | **Pflichtteils-Check**: für jede Person islamische Quote mit Pflichtteilsquote vergleichen und Unterdeckung warnen. Kritisch u. a. bei Ehefrau (1/8 islamisch neben Kindern), nicht-muslimischen Kindern und Ehepartnern (islamisch 0), Eltern. Hinweis auf Pflichtteilsverzicht (notariell, § 2348 BGB) und Anwaltsberatung. | **[R]** §§ 2303 ff. BGB: Abkömmlinge, Eltern und Ehegatten können die Hälfte ihres gesetzlichen Erbteils als Geldanspruch verlangen. Ein islamisch begründeter Ausschluss lässt sich gegen ihren Willen nicht durchsetzen. Bei Zugewinngemeinschaft kommt der Zugewinnausgleich hinzu (§ 1371 BGB). |
| Vermögenserfassung | Typenliste, Immobiliendaten, keine Beträge | **Ja** | Vermögensübersicht als **Vorsorge-Ordner** (Konten, Versicherungen, Immobilien, digitale Konten, Schulden, Zakat-Rückstände), optional mit Beträgen für Pflichtteils- und Erbschaftsteuerhinweise. | **[R]** Erbschaftsteuer-Freibeträge (z. B. Ehegatte €500.000, Kind €400.000, § 16 ErbStG) unterscheiden sich vom britischen System mit Nil-Rate Band und RNRB. Lebensversicherungen mit Bezugsrecht fallen nicht in den Nachlass. |
| Wasiyyah bis 1/3 | Prozentanteile an Spendenorganisationen und Personen; Verzeichnis britischer Organisationen | **Ja (inhaltlich)** | Vermächtnis-Modul mit **harter 1/3-Grenze** und Warnung. Geldbetrag, Prozent oder konkreter Gegenstand. Liste in DE steuerbegünstigter Organisationen (eigene Recherche, ohne Empfehlung). Warnung bei Vermächtnissen an gesetzliche Erben. | **[R]** In DE sind das Vermächtnisse im Sinne der §§ 2147 ff. BGB. Die Drittel-Grenze ist eine religiöse, keine zivilrechtliche Grenze; das BGB begrenzt nur über den Pflichtteil. Zuwendungen an steuerbegünstigte Körperschaften sind erbschaftsteuerfrei (§ 13 Abs. 1 Nr. 16 ErbStG). |
| Janazah- und Bestattungswünsche | Freitext im Testament (Moschee, Friedhof) | **Ja, aber als eigenes Modul** | Strukturiertes **Janazah-Modul** außerhalb des Testaments: Ansprechpersonen, Waschung, Leichentuch, Erdbestattung ohne Sarg (wo erlaubt), Rückführung ja/nein, Moschee, Friedhof bzw. Grabfeld, Bestatter. Sofort für Vertrauenspersonen abrufbar. | **[R]** Ein Testament wird oft erst Wochen nach dem Tod eröffnet (§ 2260 BGB, §§ 348 ff. FamFG), Bestattungswünsche im Testament kommen also meist zu spät. Gilt die Totenfürsorge der Angehörigen. Sargpflicht, Fristen und Grabfelder regeln die Länder unterschiedlich; die Regeln pro Bundesland pflegen. |
| Vormund für minderjährige Kinder | Benennung im Testament, auch mehrere Vormünder | **Ja (angepasst)** | Benennung des gewünschten Vormunds mit Begründung, ggf. Ersatzvormund, Ausschluss bestimmter Personen, Wunsch zur religiösen Erziehung. | **[R]** Eltern können einen Vormund durch letztwillige Verfügung benennen und Personen ausschließen (§ 1782 BGB nach der Reform 2023). Das Familiengericht entscheidet am Ende nach dem Kindeswohl. Die Benennung ist **nur in formgültigem Testament** wirksam. |
| Vollstrecker und Treuhänder | Dieselben Personen, 2 Volljährige | **Teilweise** | Optionale Testamentsvollstreckung (§§ 2197 ff. BGB) und Vertrauenspersonen für die Bestattung, getrennt erfassen. Trust entfällt. | **[R]** In DE geht der Nachlass direkt auf die Erben über (§ 1922 BGB). Ein Probate-Verfahren gibt es nicht; als Nachweis dienen Erbschein oder ein notarielles Testament mit Eröffnungsprotokoll. |
| **Erstellung des Testaments und Form** | Generiertes PDF zum Ausdrucken und Unterschreiben vor 2 Zeugen | **NEIN – nicht übertragbar** | **Kein unterschriftsfertiges Ausdruck-Testament.** Stattdessen: (a) **Abschreibvorlage** für ein vollständig eigenhändiges Testament mit Form-Checkliste (komplett handschriftlich, Ort, Datum, Unterschrift mit Vor- und Nachname, keine Ausdrucke, keine Anlagen mit Inhalt), oder (b) **Entwurf für Notar oder Anwalt** (öffentliches Testament). | **[R]** § 2247 BGB: Ein privates Testament muss **vollständig eigenhändig geschrieben und unterschrieben** sein. Ein gedrucktes oder generiertes Testament ist **formnichtig** (§ 125 BGB), auch mit Unterschrift und Zeugen. Zeugen sind beim eigenhändigen Testament nicht vorgesehen. Alternativ notarielles Testament (§ 2232 BGB, BeurkG). |
| Paare bzw. Spiegeltestamente | Nicht angeboten; getrennte Testamente empfohlen | **Nein (anderes Institut)** | Für Ehegatten: entweder zwei Einzeltestamente oder ein **gemeinschaftliches Testament** mit deutlicher Warnung zur Bindungswirkung. Islamisch: Ehegatten erben voneinander nur Quoten. Ein „Berliner Testament“ (gegenseitige Alleinerbschaft) widerspricht den islamischen Quoten; darauf hinweisen. | **[R]** §§ 2265 ff. BGB: Ein Ehegatte schreibt eigenhändig, der andere unterschreibt mit (§ 2267 BGB). Wechselbezügliche Verfügungen binden nach dem Tod des Ersten (§§ 2270, 2271 BGB). |
| Juristische Prüfung | Hausinterne Solicitor, im Preis enthalten, bis 7 Tage | **Nur in anderer Form** | Optionale Prüfung durch **unabhängige deutsche Rechtsanwältinnen und Rechtsanwälte** (oder ein Notariat), direkt mandatiert, transparente Festpreise der Kanzlei. Amanah selbst gibt **keine Einzelfallberatung**. Getrennt davon: Religiöse Fragen beantworten Gelehrte; das ist keine Rechtsberatung. | **[R]** RDG § 2 Abs. 1 und § 3: Eine rechtliche Prüfung im konkreten Einzelfall ist Rechtsanwälten bzw. Notaren vorbehalten. Ein Generator mit standardisierten Fragen ist laut BGH zulässig (Urteil vom 09.09.2021, I ZR 113/20, „Smartlaw“), solange er keine individuelle Prüfung vortäuscht. **Provisionsverbot**: Anwälte dürfen für die Vermittlung von Mandaten nichts zahlen (§ 49b Abs. 3 BRAO), das prägt das Erlösmodell. |
| Status-Workflow (eingereicht → geprüft → freigegeben) | Ja | **Ja** | Ablauf für den Entwurf: Entwurf → (optional) Anwaltsprüfung → Freigabe des Entwurfs → Nutzer schreibt ab → **Nutzer bestätigt: „eigenhändig geschrieben, unterschrieben, verwahrt“**. | – |
| Ausgabe und Verwahrung | PDF-Download, keine Verwahrung erkennbar | **Teilweise** | PDF-**Entwurf**, deutlich als „KEIN TESTAMENT – nur Abschreibvorlage“ gekennzeichnet. Hinweise zur **amtlichen Verwahrung** beim Amtsgericht (§ 2248 BGB) mit Registrierung im **Zentralen Testamentsregister** der Bundesnotarkammer. Digitaler Tresor für sonstige Vorsorgedokumente. | **[R]** Ein handschriftliches Original lässt sich nicht digital ersetzen. Wer ein Testament findet, muss es beim Nachlassgericht abliefern (§ 2259 BGB). |
| Änderungen und Abo | 1 Jahr kostenlos, danach £10 pro Jahr; nach jeder Änderung neu unterschreiben | **Teilweise** | Änderungen am Datenbestand und Entwurf jederzeit; Erinnerungen bei Lebensereignissen (Geburt, Heirat, Tod eines Erben). Klare Botschaft: Jede Änderung heißt **neu von Hand schreiben** (oder Nachtrag, ebenfalls eigenhändig) und **altes Testament widerrufen bzw. vernichten** (§§ 2253 ff. BGB). Ein Abo ist denkbar (Vorsorge-Ordner, Erinnerungen), muss aber zum Verbraucherrecht passen. | **[R]** Für Abos gelten in DE der Kündigungsbutton (§ 312k BGB) und die Laufzeitregeln (§ 309 Nr. 9 BGB). |
| Telefon-Service | £148, Erstellung durch die Solicitor | **Nur über Kanzleien** | Telefonische Erstellung **nur durch die Kanzlei** im eigenen Mandat, nicht durch Amanah. | **[R]** RDG |
| Vorsorgevollmacht, Patientenverfügung | Nicht angeboten | **Neu sinnvoll** | Erklärung und Hinweise; Vorlagen des BMJ verlinken statt eigener Vorlagen. Registrierung im Zentralen Vorsorgeregister (BNotK). | **[R]** Rechtsinstitute nach §§ 164 ff. und 1827 BGB. |
| Datenschutz | Datenschutzerklärung, „world-class security“ (Werbeaussage) | **Strenger nötig** | Religionszugehörigkeit ist ein besonders geschütztes Datum: **ausdrückliche Einwilligung** nach Art. 9 Abs. 2 lit. a DSGVO, Hosting in der EU, Ende-zu-Ende-Verschlüsselung für Tresordokumente erwägen, Regeln zur Freigabe an Vertrauenspersonen. | **[R]** DSGVO Art. 9; UK-GDPR ist ähnlich, die Aufsichtspraxis in DE strenger. |
| Haftung und Regulierungshinweise | „Keine Kanzlei“, nicht reguliert, keine Haftung für Eingaben | **Ja (Prinzip)** | Klare Abgrenzung: Amanah informiert und bereitet vor, ersetzt keine Rechtsberatung. Die Kanzleien haften im eigenen Mandat. Impressum und AGB nach deutschem Recht; Hinweise zur Berufshaftpflicht der Partnerkanzleien. | **[R]** RDG, BRAO, UWG (Irreführung vermeiden, z. B. keine Aussage „rechtssicher“ ohne Anwaltsprüfung). |
| Freunde einladen | Persönlicher Link, religiöse Motivation | **Ja** | Einladung von Familienmitgliedern (auch für gemeinsame Vorsorge) mit Einwilligung, ohne Tracking der Eingeladenen. | UWG, § 7 (Werbung per E-Mail an Dritte): nur von Nutzern selbst ausgelöst, sonst Abmahnrisiko. |
| Spendenverzeichnis | Über 1.000 UK-Organisationen, ausdrücklich ohne Empfehlung | **Ja (Prinzip)** | Eigenes DE-Verzeichnis mit Prüfkriterium (Gemeinnützigkeit), ohne Empfehlung. | Spendenabzug bzw. ErbSt-Befreiung nur für steuerbegünstigte Körperschaften. |

---

## 3. Übertragbare UX-Muster (ohne Übernahme von Texten oder Gestaltung)

**[I]** Diese Muster sind funktional sinnvoll. Ihre Übertragung ist eine Empfehlung, kein Befund.
1. Kurzer Einstieg ohne Konto, dann Konto zum Speichern; zahlen erst, wenn ein Mehrwert sichtbar ist
   (Vorschau bzw. Anwaltsprüfung).
2. Dashboard mit 3–4 Schritt-Karten und realistischer Zeitangabe je Schritt, Fortschrittsanzeige,
   automatisches Speichern.
3. Personen einmal anlegen und in mehreren Rollen verknüpfen (Erbe, Vormund, Vollstrecker, Vertrauensperson).
4. Für die Erbquoten keine Beträge erfragen (senkt die Hürde). Beträge nur optional für Pflichtteils- und
   Steuerhinweise.
5. Statusanzeige für die externe Prüfung mit E-Mail-Benachrichtigung.
6. Ehrlicher Hinweis bei Auslandsvermögen statt eines stillen Ausschlusses.
7. Live-Chat bzw. Support zu Bürozeiten. Rückrufe nur für technische und produktbezogene Fragen, nicht für
   Rechtsfragen (RDG).

## 4. Lücken bei True Wills, die Amanah besser lösen kann
- **[V]** Keine Madhab-Auswahl sichtbar, keine Gelehrtenprüfung genannt. Amanah kann beides transparent zeigen.
- **[V]** Janazah nur als Freitext im Testament. Amanah: strukturiertes Modul, sofort für Vertrauenspersonen
  abrufbar.
- **[V]** Keine Verwahrung und kein Notfallzugang erkennbar. Amanah: Vorsorge-Tresor plus Hinweise zum
  Zentralen Testamentsregister.
- **[V]** Unbeantwortete FAQ-Einträge („Answer TBC“) und widersprüchliche Abo-Preise (£20 bzw. £10) im
  Bestand. Lehre: Inhalte pflegen und datieren.
- **[V]** Keine Lösung für Paare. Amanah: geführte Entscheidung zwischen Einzeltestament und
  gemeinschaftlichem Testament mit Bindungswarnung.

## 5. Offene Punkte und Grenzen dieser Recherche
- Die Live-Seite und das Portal waren am 2026-10-30 nicht erreichbar. Alle Produktangaben stammen aus
  Archiv-Snapshots von 2021–2026 bzw. aus dem Portal-Bundle von 02/2023 und können vom letzten echten
  Produktstand abweichen.
- Die Portal-Auswertung beruht auf Benutzeroberflächentexten im ausgelieferten JavaScript. Echte
  Bildschirmabläufe, das PDF-Muster und der Wortlaut der Testamente wurden **nicht** gesehen (und sollen
  auch nicht übernommen werden).
- Der Trustpilot-Befund beruht auf einer automatisierten Seitenzusammenfassung (WebFetch), Stand 2026-10-30.
- Das Nachfolgeangebot von Wahed wurde nur oberflächlich erfasst; separat untersuchen, falls relevant.
- Alle **[R]**-Hinweise sind ungeprüfte Orientierung und vor der Umsetzung anwaltlich zu verifizieren,
  insbesondere: § 1782 BGB (Vormundbenennung nach der Reform 2023), Pflichtteilsrechnung im Zusammenspiel mit
  dem Zugewinnausgleich, ordre public bei ausländischem Erbstatut, § 49b Abs. 3 BRAO für das Partnermodell.

## Quellen
- Live-Prüfung: `curl -sSL https://truewills.co.uk/` → `/cgi-sys/suspendedpage.cgi` (2026-10-30)
- Wayback-CDX-Index: `https://web.archive.org/cdx/search/cdx?url=truewills.co.uk*`
- Snapshots: siehe Tabelle in Abschnitt 0
- Trustpilot: https://uk.trustpilot.com/review/truewills.co.uk (2026-10-30)
- Legal Futures, 14.02.2023: https://www.legalfutures.co.uk/latest-news/islamic-fintech-company-buys-law-firm-specialising-in-shariah-wills
- Wahed Wills UK: https://wahed.com/uk/wills (2026-10-30)
- Lokale Rohdaten (Archiv-HTML, extrahierte Texte):
  `/tmp/claude-1000/-mnt-daten-03-MSC-Engineering-01-Aktive-Projekte-Projects-amanah-app/c6db0b57-992d-48b0-8932-9e9ebd224b8c/scratchpad/tw_raw/`
