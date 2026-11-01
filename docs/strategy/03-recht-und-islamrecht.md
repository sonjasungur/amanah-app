# Phase C – Rechtliche Vorrecherche: Testamentsvorbereitung, islamisches Erbrecht, Umsetzung im deutschen Recht

> **Korrekturen 01.11.2026:** siehe [Doku 32 §4](32-juristische-pruefpunkte.md) (§§ 59a/59b BRAO, BGH IX ZR 89/23, Spannung zu BGH IV ZR 110/21, § 10 IV LPartG, EuErbVO-Text abrufbar).

**Projekt:** Amanah (digitales Vorsorgeportal für muslimische Familien in Deutschland)
**Stand der Recherche:** 2026-10-30
**Zweck:** Arbeitsmaterial für die Prüfung durch unabhängige Fachanwältinnen/Fachanwälte für Erbrecht.

> **WICHTIGER HINWEIS**
> Dieses Dokument ist **keine Rechtsberatung, keine Rechtsauskunft und keine rechtliche Freigabe**. Es ist eine
> technische Vorrecherche eines Softwareanbieters. Sie soll die anwaltliche Prüfung strukturieren, nicht ersetzen.
> Alle Aussagen sind vorläufig. Jede Stelle mit **UNGEKLÄRT / anwaltlich zu prüfen** braucht eine ausdrückliche
> anwaltliche Bewertung, bevor daraus Produktentscheidungen abgeleitet werden. Auch Stellen ohne diese Markierung
> sind nicht anwaltlich geprüft.
> Es werden bewusst **keine Musterklauseln** formuliert.

## 0. Quellenstatus (Legende)

| Kürzel | Bedeutung |
|---|---|
| **[V]** | Primärquelle in dieser Recherche abgerufen und inhaltlich geprüft (Normtext auf gesetze-im-internet.de, Urteilstext/Volltext-Zusammenfassung, Koranvers auf quran.com) |
| **[S]** | Nur über Sekundärquellen bestätigt (Kanzlei-/Fachportale, Datenbank-Snippets); Primärtext nicht selbst gelesen |
| **[K]** | Aus allgemeinem Fachwissen, in dieser Recherche **nicht** online verifiziert – vor Verwendung prüfen |

Technische Einschränkung: Die EUR-Lex-Seiten zur EuErbVO (VO (EU) Nr. 650/2012) und DSGVO lieferten beim Abruf
keinen auswertbaren Text. Artikelinhalte der EuErbVO sind daher nur **[S]/[K]**. Primärlink:
https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32012R0650 ;
DSGVO: https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679

---

## Teil 1 – Anforderungsmatrix deutsches Recht

Normlinks folgen dem Schema `https://www.gesetze-im-internet.de/bgb/__<Nr>.html` (BGB), `.../rdg/__<Nr>.html`,
`.../brao/__<Nr>.html`, `.../beurkg/__<Nr>.html`, `.../bgbeg/art_<Nr>.html`.

### 1.1 Testierfreiheit und Formen

| Anforderung | Rechtsgrundlage | Bedeutung für das Produkt | Risiko | Quelle | offen? |
|---|---|---|---|---|---|
| Testierfreiheit: Erblasser kann Erben durch Verfügung von Todes wegen frei bestimmen; verfassungsrechtlich durch Erbrechtsgarantie geschützt | §§ 1937–1941 BGB; Art. 14 Abs. 1 GG | Grundlage dafür, dass eine an islamischen Quoten orientierte Verteilung im deutschen Recht grundsätzlich gestaltbar ist | Grenzen: Pflichtteil, § 138 BGB, § 2065 BGB, Formvorschriften | §§ 1937 ff. [K]; Art. 14 GG [K]; BVerfG 1 BvR 2248/01 [S] | Reichweite bei religiös motivierten Bedingungen: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Eigenhändiges Testament: **gesamter Text** eigenhändig geschrieben **und** unterschrieben; Zeit/Ort „soll“; Unterschrift „soll“ Vor- und Familiennamen enthalten; Minderjährige und Leseunfähige ausgeschlossen | § 2247 Abs. 1–5 BGB | Ein vom Portal **gedrucktes oder generiertes** Dokument ist als eigenhändiges Testament **formnichtig** (§ 125 BGB). Das Portal kann höchstens eine *Vorlage zum vollständigen handschriftlichen Abschreiben* bzw. eine Gesprächsgrundlage für Anwalt/Notar liefern | Abschreibfehler, Teilabschriften, maschinell ergänzte Seiten, Unterschrift nur unter Ausdruck → Nichtigkeit; Nutzer mit Leseschwäche/Sehbehinderung | https://www.gesetze-im-internet.de/bgb/__2247.html [V] | UX-Gestaltung der „Abschreibvorlage“ und Haftungsfolgen: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Ordentliche Testamentsformen: notarielles oder eigenhändiges Testament | § 2231 BGB | Produkt muss beide Wege erklären, ohne selbst eine Form „herzustellen“ | – | § 2231 [K] | – |
| Notarielles Testament: Erklärung gegenüber Notar **oder Übergabe einer Schrift** (offen/verschlossen); die Schrift muss nicht eigenhändig sein | § 2232 BGB; §§ 17, 28, 30 BeurkG | Ein vom Nutzer vorbereiteter (auch gedruckter) Entwurf kann Gesprächs-/Übergabegrundlage beim Notar sein; Notar hat Prüfungs- und Belehrungspflichten (§ 17 BeurkG), bei verschlossener Schrift eingeschränkt | Nutzer könnte glauben, der Entwurf sei „geprüft“; Notarkosten (GNotKG) | § 2232 [K]; BeurkG [K] | Ob/wie das Portal Entwürfe für § 2232-Übergabe aufbereiten darf: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Gemeinschaftliches Testament nur für Ehegatten/Lebenspartner; eigenhändig: einer schreibt, beide unterschreiben | §§ 2265, 2267 BGB | Paar-Modus im Portal: deutlich auf Bindungswirkung hinweisen | Ungewollte Bindung | §§ 2265 ff. [K] | – |
| Berliner Testament (gegenseitige Einsetzung, Dritter als Schlusserbe) mit Auslegungsregel | § 2269 BGB | Häufiges deutsches Standardmodell; kollidiert inhaltlich mit islamischer Verteilung (Ehegatte als Alleinerbe) | Konflikt zwischen Paar-Wunsch und islamischen Quoten | § 2269 [K] | **UNGEKLÄRT / anwaltlich zu prüfen**, ob/wie Berliner Modell mit islamischen Quoten kombinierbar ist |
| Wechselbezüglichkeit: Unwirksamkeit einer Verfügung erfasst die andere; gilt nur für Erbeinsetzung, Vermächtnis, Auflage **und Wahl des anzuwendenden Erbrechts** | § 2270 Abs. 1–3 BGB | Eine Rechtswahl (Art. 22 EuErbVO) in gemeinschaftlichem Testament kann wechselbezüglich und damit bindend werden | Spätere Änderung (z. B. nach Familienänderung) nicht mehr möglich | https://www.gesetze-im-internet.de/bgb/__2270.html [V] | – |
| Widerruf wechselbezüglicher Verfügungen zu Lebzeiten nur durch notariell beurkundete Erklärung (Verweis auf Rücktritt beim Erbvertrag, § 2296); nach Tod des Erstversterbenden grundsätzlich bindend | § 2271 BGB | Portal muss Bindung vor Abschluss erklären | Irreversibilität | § 2271 [K] | – |

### 1.2 Gesetzliche Erbfolge, Ehegatten, Güterstand, Pflichtteil

| Anforderung | Rechtsgrundlage | Bedeutung für das Produkt | Risiko | Quelle | offen? |
|---|---|---|---|---|---|
| Gesetzliche Erbfolge nach Ordnungen (Abkömmlinge, Eltern und deren Abkömmlinge, Großeltern …); **keine** Unterscheidung nach Geschlecht oder Religion | §§ 1924–1930 BGB | Vergleichsrechner „Was gilt ohne Testament?“ ist zentral, weil islamische Verteilung **nur durch Verfügung** erreichbar ist | Fehlerhafte Rechnerlogik | §§ 1924 ff. [K] | – |
| Ehegattenerbrecht: neben Abkömmlingen 1/4, neben 2. Ordnung/Großeltern 1/2; bei Gütertrennung Sonderregel (Abs. 4) | § 1931 BGB | Muss mit Güterstand gekoppelt berechnet werden | – | § 1931 [K] | – |
| Zugewinngemeinschaft: pauschale Erhöhung um 1/4 (erbrechtliche Lösung) bzw. bei Ausschlagung/Enterbung Zugewinnausgleich + „kleiner Pflichtteil“ (güterrechtliche Lösung) | § 1371 Abs. 1–3 BGB | Güterstand muss im Portal abgefragt werden; beeinflusst Pflichtteil des Ehegatten massiv | Fehlannahme Güterstand (ausländische Ehe!) | § 1371 [K] | Güterrechtsstatut bei im Ausland geschlossenen Ehen (EuGüVO, Art. 229 § 47 EGBGB): **UNGEKLÄRT / anwaltlich zu prüfen** |
| Güterstände: Zugewinngemeinschaft (gesetzlich), Gütertrennung, Gütergemeinschaft; Wahlzugewinngemeinschaft (dt.-franz.) | §§ 1363 ff., 1414, 1415 ff. BGB | Abfrage + Hinweis, dass Eheverträge (ggf. ausländische/Mahr-Vereinbarungen) relevant sein können | Mahr-Vereinbarungen werden falsch eingeordnet | [K] | Behandlung der Mahr (Brautgabe) als Nachlassverbindlichkeit: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Pflichtteil: Abkömmlinge, Eltern (nur ohne Abkömmlinge), Ehegatte; Höhe = Hälfte des gesetzlichen Erbteils; reiner **Geldanspruch** gegen die Erben | § 2303 BGB | Kernkonflikt mit islamischer Verteilung (siehe Teil 3); Portal muss Pflichtteile **neben** der Wunschverteilung zeigen | Pflichtteilsansprüche unterlaufen das Verteilungsziel wirtschaftlich | § 2303 [K] | – |
| Pflichtteilsrestanspruch, wenn Zugewendetes unter Pflichtteil liegt | §§ 2305, 2307 BGB | Relevant, wenn z. B. die Ehefrau mit 1/8 bedacht wird | – | [K] | – |
| Pflichtteilsergänzung bei Schenkungen (10-Jahres-Abschmelzung; bei Ehegatten Fristbeginn nicht vor Eheauflösung) | § 2325 BGB | Lebzeitige „Ausgleichs“-Schenkungen an Söhne/Töchter lösen Ergänzungsansprüche aus | – | [K] | – |
| Pflichtteilsentziehung nur aus abschließenden Gründen; Religionsverschiedenheit ist **kein** Grund | § 2333 BGB | Nicht-muslimische Angehörige behalten Pflichtteil | – | [K] | – |
| Anfechtung bei Übergehen eines (später hinzugekommenen) Pflichtteilsberechtigten; Unwirksamkeit von Ehegattenverfügungen bei Scheidung | §§ 2077, 2078, 2079 BGB | **Zeitlücke Entwurf ↔ Tod**: neue Kinder, Heirat, Scheidung → Erinnerungs-/Review-Funktion nötig | Anfechtbarkeit des gesamten Testaments | [K] | – |

### 1.3 Inhalt der Verfügung

| Anforderung | Rechtsgrundlage | Bedeutung für das Produkt | Risiko | Quelle | offen? |
|---|---|---|---|---|---|
| Erbeinsetzung vs. Vermächtnis: Zuwendung des Vermögens/Bruchteils = Erbeinsetzung; Zuwendung einzelner Gegenstände im Zweifel kein Erbe | §§ 2087, 2147 ff. BGB | Islamische „Anteile“ entsprechen Erbquoten (Bruchteile) → Erbeinsetzung; wasiyya (bis 1/3) an Nichterben eher Vermächtnis | Fehlqualifikation führt zu falscher Erbengemeinschaft | § 2087 [K] | Qualifikation einer „wasiyya“ im Einzelfall: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Drittbestimmungsverbot: Erblasser darf Geltung der Verfügung nicht von Dritten abhängig machen (Abs. 1) und die Bestimmung von Person des Bedachten / Gegenstand der Zuwendung nicht Dritten überlassen (Abs. 2) | § 2065 BGB | „Der Imam / ein Gelehrter soll festlegen, wer was erbt“ ist für **Erbeinsetzungen** hochriskant | Unwirksamkeit der Erbeinsetzung → gesetzliche Erbfolge | https://www.gesetze-im-internet.de/bgb/__2065.html [V] | Zulässigkeit, wenn Dritter nur nach vom Erblasser vorgegebenen, objektiv nachprüfbaren Kriterien „bezeichnet“ (Rspr. seit BGHZ 15, 199 [K, nicht verifiziert]): **UNGEKLÄRT / anwaltlich zu prüfen** |
| Vermächtnis: Drittbestimmung innerhalb eines vom Erblasser bestimmten Personenkreises/Anteils zulässig; Zweckvermächtnis | §§ 2151, 2153, 2156 BGB | Flexibleres Instrument als Erbeinsetzung, falls spätere Bestimmung gewünscht | Abgrenzung zu § 2065 | [K] | **UNGEKLÄRT / anwaltlich zu prüfen** |
| Teilungsanordnung; Auseinandersetzung nach billigem Ermessen eines Dritten anordenbar | § 2048 BGB | Verteilung einzelner Gegenstände (Immobilie an Sohn, Ausgleich an Tochter) | Abgrenzung zum Vorausvermächtnis (§ 2150) | [K] | – |
| Auflage (z. B. islamische Bestattung, Spende) | §§ 1940, 2192 ff. BGB | Religiöse Wünsche ohne Erbquote | Durchsetzbarkeit | [K] | – |
| Bedingungen; Sittenwidrigkeit | §§ 2074 ff., 138 BGB | Bedingungen wie „nur wenn Erbe Muslim bleibt“ greifen in Art. 4 GG des Bedachten ein | Nichtigkeit der Bedingung/Verfügung | § 138 [K]; BVerfG 1 BvR 2248/01 [S] | **UNGEKLÄRT / anwaltlich zu prüfen** – Portal sollte solche Bedingungen **nicht** anbieten |
| Testamentsvollstreckung (Abwicklungs-/Dauervollstreckung) | §§ 2197 ff. BGB; § 5 Abs. 2 Nr. 1 RDG | Vollstrecker könnte Umsetzung der Verteilung sichern | Kosten; Auswahl | [K]; § 5 RDG [V] | – |
| Vormundbenennung für minderjährige Kinder durch Eltern in letztwilliger Verfügung; Benennung natürlicher Person, Ehegatten gemeinsam, Ausschluss möglich; bei widersprechenden Verfügungen gilt die des Letztverstorbenen | **§ 1782 BGB** (Fassung seit 01.01.2023, Vormundschaftsreform) | Numerierung bestätigt: § 1782 Abs. 1, 2 BGB „Benennung und Ausschluss als Vormund durch die Eltern“ | Formerfordernis = letztwillige Verfügung (also § 2247/§ 2232) | https://www.gesetze-im-internet.de/bgb/__1782.html [V] | – |

### 1.4 Widerruf, Verwahrung, Register

| Anforderung | Rechtsgrundlage | Bedeutung für das Produkt | Risiko | Quelle | offen? |
|---|---|---|---|---|---|
| Widerruf durch Testament, Vernichtung/Veränderung, Rücknahme aus amtlicher Verwahrung (nur notarielles Testament gilt dann als widerrufen) | §§ 2253–2258 BGB | Versionierung im Portal ≠ rechtlicher Widerruf; klar kommunizieren | Nutzer hält „Löschen im Portal“ für Widerruf | [K] | – |
| Besondere amtliche Verwahrung eigenhändiger Testamente beim Nachlassgericht | § 2248 BGB | Hinweis/Checkliste | – | [K] | – |
| Zentrales Testamentsregister (Bundesnotarkammer) für verwahrte Urkunden | §§ 78c ff. BNotO [K: genaue §§ prüfen]; § 34a BeurkG | Portal-„Tresor“ ersetzt **keine** amtliche Verwahrung | Testament wird nicht gefunden | [K] | – |

### 1.5 Internationales Erbrecht

| Anforderung | Rechtsgrundlage | Bedeutung für das Produkt | Risiko | Quelle | offen? |
|---|---|---|---|---|---|
| Objektive Anknüpfung: gewöhnlicher Aufenthalt im Todeszeitpunkt | Art. 21 Abs. 1 EuErbVO | Für in Deutschland lebende Muslime gilt i. d. R. **deutsches** Erbrecht – unabhängig von Religion und Staatsangehörigkeit | Fehlannahme „Ich bin Türke/Marokkaner, also gilt mein Heimatrecht“ | [S] (u. a. justiz.nrw, ETL) | – |
| Rechtswahl nur zugunsten des Rechts eines Staates, dem der Erblasser bei Wahl oder Tod angehört; Mehrstaater: jedes Heimatrecht; Form einer Verfügung von Todes wegen | Art. 22 EuErbVO | **„Scharia“ als solche ist nicht wählbar** – nur ein staatliches Recht (z. B. ägyptisches, marokkanisches) | Gewähltes Recht kann ordre-public-widrig sein (Art. 35) | [S] haufe/iww-Zusammenfassungen | Zulässigkeit/Wirkung im Einzelfall: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Errichtungsstatut (Zulässigkeit/materielle Wirksamkeit) | Art. 24, 25 EuErbVO | Relevant bei späterem Umzug | – | [K] | – |
| Formgültigkeit: Haager Testamentsformübereinkommen 1961 gilt für Deutschland fort | Art. 27, 75 EuErbVO; Art. 26 EGBGB | Auch im Ausland geschriebene Testamente können formwirksam sein | – | [K] | – |
| Rück-/Weiterverweisung bei Recht eines Drittstaats | Art. 34 EuErbVO | Drittstaatenimmobilien → mögliche **Nachlassspaltung** | Doppelte Verfahren, abweichende Erben je Vermögensmasse | [K] | **UNGEKLÄRT / anwaltlich zu prüfen** pro Staat |
| Ordre public: Anwendung ausländischen Rechts versagt, wenn offensichtlich unvereinbar; Einzelfall- und Ergebnisbetrachtung, hinreichender Inlandsbezug | Art. 35 EuErbVO; Art. 6 EGBGB | Gewähltes islamisch geprägtes Recht kann in Deutschland in Teilen nicht angewandt werden (Religionsausschluss, Ungleichbehandlung, fehlender Pflichtteil) | Ergebnis weicht vom Erblasserwillen ab | BGH IV ZR 110/21 [V]; OLG Hamm 15 W 117/04 [V] | siehe 1.7 |
| **Türkei**: Deutsch-türkisches Nachlassabkommen (Anlage zu Art. 20 Konsularvertrag v. 28.05.1929), § 14: beweglicher Nachlass → Heimatrecht, unbeweglicher → Belegenheitsrecht; Vorrang vor EuErbVO | Art. 75 Abs. 1 EuErbVO; Nachlassabkommen § 14 (RGBl. 1930 II S. 747; Fortgeltung Bek. v. 26.02.1952) | Türkische Staatsangehörige in DE: beweglicher Nachlass nach **türkischem** Recht, Immobilien in DE nach deutschem, in TR nach türkischem Recht. **Achtung:** türkisches ZGB ist säkular (gleiche Anteile, Pflichtteil) – **kein** islamisches Erbrecht | Falsche Erwartung „Türkisches Recht = islamisches Recht“; Doppelstaater-Fragen | [S] haufe, rechtslupe, BGH IV ZR 68/15 (Zuständigkeit, § 15) [S] | Anwendbarkeit auf deutsch-türkische Doppelstaater, Zuständigkeit § 15: **UNGEKLÄRT / anwaltlich zu prüfen** |
| **Iran**: Deutsch-iranisches Niederlassungsabkommen 1929 (Art. 8 Abs. 3) – Heimatrecht für iranische Staatsangehörige; Vorrang vor EuErbVO; Doppelstaater-Problematik | Art. 75 EuErbVO | Iranisches (schiitisch geprägtes) Erbrecht kann kraft Abkommens gelten | ordre public | [S] (haufe ZErb 10/2015-Titel) | **UNGEKLÄRT / anwaltlich zu prüfen** |
| **Ägypten / Marokko**: islamisch geprägtes staatliches Erbrecht (Ägypten: Gesetz Nr. 77/1943, Gesetz Nr. 71/1946 über Wasiyya; Marokko: Moudawana, Buch VI) | Art. 22, 34, 35 EuErbVO | Rechtswahl für Staatsangehörige theoretisch möglich; Immobilien vor Ort richten sich ggf. nach dortigem IPR (Nachlassspaltung) | ordre public; lokale Anerkennung deutscher Erbscheine | OLG Hamm 15 W 117/04 (ägypt. Recht) [V]; Gesetzesnummern [K] | **UNGEKLÄRT / anwaltlich zu prüfen** |
| **Bosnien-Herzegowina**: Erbrecht säkular (Entitätsgesetze), kein islamisches Erbrecht | – | Erwartungsmanagement wie bei Türkei | – | [K] | IPR-Anknüpfung für Immobilien: **UNGEKLÄRT / anwaltlich zu prüfen** |

### 1.6 Berufsrecht, Rechtsdienstleistung, Datenschutz

| Anforderung | Rechtsgrundlage | Bedeutung für das Produkt | Risiko | Quelle | offen? |
|---|---|---|---|---|---|
| Rechtsdienstleistung = Tätigkeit in **konkreten fremden** Angelegenheiten, sobald sie eine **rechtliche Prüfung des Einzelfalls** erfordert | § 2 Abs. 1 RDG | Maßstab für jede individualisierende Portalfunktion | Unerlaubte RDL → § 3a UWG-Abmahnung, Nichtigkeit (§ 134 BGB), Bußgeld (§ 20 RDG [K]) | https://www.gesetze-im-internet.de/rdg/__2.html [V] | – |
| Selbständige außergerichtliche RDL nur mit Erlaubnis | § 3 RDG | Amanah hat keine Erlaubnis → darf keine RDL erbringen | s. o. | § 3 [K] | – |
| **BGH „Smartlaw“**: Digitaler Generator, der per Frage-Antwort-System vorgefertigte Textbausteine für **typische, fiktive** Fälle kombiniert, ist **keine** RDL. Begründung (laut Urteilszusammenfassung): Tätigkeit des Anbieters liegt vor; Angelegenheit ist „fremd“; es fehlt aber die **Konkretheit**: keine individuelle Prüfung, keine Rückfragen, keine Anpassung an Besonderheiten; vergleichbar mit Formularhandbuch; Nutzer erwartet keine Einzelfallprüfung | BGH, Urt. v. 09.09.2021 – I ZR 113/20 | Je mehr das Portal individuell „prüft“, Rückfragen stellt, Konstellationen bewertet oder Wirksamkeit bestätigt, desto näher an RDL. Islamischer Rechner, der für eine **konkrete Familie** Quoten ausgibt, und Pflichtteils-Warnungen pro Familie sind gesondert zu bewerten | Werbung wie „Anwaltsqualität“ wurde vom BGH **nicht** entschieden (im Berufungsverfahren zurückgenommen) | gesetze.co/urteile/I_ZR_113-20 [V, Volltext-Zusammenfassung]; LTO, beck-aktuell [S] | Ob ein Erbrechts-/Islam-Rechner mit Individualausgabe unter Smartlaw fällt: **UNGEKLÄRT / anwaltlich zu prüfen**. Ob die Anwendung **religiöser (nichtstaatlicher) Normen** „rechtliche Prüfung“ i. S. d. RDG ist: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Erlaubte Nebenleistungen; ausdrücklich: Testamentsvollstreckung | § 5 Abs. 1, 2 Nr. 1 RDG | Trägt das Geschäftsmodell vermutlich **nicht**, da Software-Hauptleistung nicht „Haupttätigkeit mit Nebenrecht“ ist | – | https://www.gesetze-im-internet.de/rdg/__5.html [V] | **UNGEKLÄRT / anwaltlich zu prüfen** |
| Verbot von Vermittlungsprovisionen: Abgabe/Annahme von Gebührenteilen oder sonstigen Vorteilen für die Vermittlung von Aufträgen unzulässig (Ausnahmen nur zwischen Rechtsanwälten) | § 49b Abs. 3 BRAO | Anwalts-Review darf **nicht** als provisionspflichtige Mandatsvermittlung gestaltet werden; erfolgsunabhängige Listing-/Werbe-/Softwareentgelte gesondert prüfen | Nichtigkeit von Vereinbarungen; berufsrechtliche Folgen für Anwälte | https://www.gesetze-im-internet.de/brao/__49b.html [V] | Zulässigkeit konkreter Plattform-Entgeltmodelle: **UNGEKLÄRT / anwaltlich zu prüfen** |
| Keine Beteiligung Dritter (Nicht-Sozien) am wirtschaftlichen Ergebnis anwaltlicher Tätigkeit | § 27 BORA (Grundlage § 59b BRAO) | Umsatzbeteiligung von Amanah an Anwaltshonoraren problematisch | wie oben | BGH III ZR 56/07 zitiert § 27 BORA [S]; Wortlaut nicht abgerufen | **UNGEKLÄRT / anwaltlich zu prüfen** |
| Religiöse Überzeugung = **besondere Kategorie** personenbezogener Daten; Verarbeitung grundsätzlich verboten, Ausnahmen u. a. ausdrückliche Einwilligung | Art. 9 Abs. 1, 2 lit. a DSGVO | Schon die Nutzung eines „islamischen“ Portals/Rechners kann Religionszugehörigkeit offenbaren; zusätzlich Angaben über **Dritte** (z. B. „Ehefrau nicht muslimisch“) = Art.-9-Daten Dritter | Einwilligung des Nutzers deckt Daten Dritter nicht ohne Weiteres ab | Art. 9 DSGVO [K, Wortlaut nicht abgerufen] | Rechtsgrundlage für Art.-9-Daten Dritter: **UNGEKLÄRT / anwaltlich bzw. datenschutzrechtlich zu prüfen** |
| Rechtmäßigkeit allgemein; Auftragsverarbeitung; TOM | Art. 6, 28, 32 DSGVO; Art. 35 (DSFA) | AVV mit Hosting/KI-Dienstleistern; Verschlüsselung, Zugriffskonzept, Löschkonzept; DSFA wahrscheinlich erforderlich | Drittlandtransfer (Art. 44 ff.) | [K] | DSFA-Pflicht: **zu prüfen (Datenschutz)** |

### 1.7 Rechtsprechung zu Testierfreiheit, Diskriminierung und islamischem Erbrecht

| Entscheidung | Kernaussage (paraphrasiert) | Relevanz | Status |
|---|---|---|---|
| **BVerfG, Beschl. v. 22.03.2004 – 1 BvR 2248/01** („Hohenzollern“) | Hob BGH, Beschl. v. 02.12.1998 – IV ZB 19/97 (BGHZ 140, 118) auf. Ebenbürtigkeitsklausel (Erbfolge an „hausgesetzmäßige“ Heirat geknüpft); Gerichte müssen bei der Kontrolle über § 138 BGB die Grundrechte des Bedachten (Eheschließungsfreiheit, Art. 6 Abs. 1 GG) berücksichtigen, wenn Bedingungen Druck auf höchstpersönliche Entscheidungen ausüben. Testierfreiheit umfasst grundsätzlich auch „ungleiche“ Verteilung. | Ungleiche Quoten als solche dürften von der Testierfreiheit gedeckt sein; **Bedingungen** mit Druck auf Religion/Ehe sind riskant | [S] – Volltext nicht gelesen; Fundstelle NJW 2004, 2008 **vs.** 2088 in Quellen widersprüchlich |
| **OLG Hamm, Beschl. v. 28.02.2005 – 15 W 117/04** (FamRZ 2005, 1705; ZEV 2005, 436) | Ägyptisches Erbrecht (Art. 25 EGBGB a. F.). Ausschluss nichtmuslimischer Kinder (Religionsverschiedenheit) verstößt gegen Art. 3 Abs. 3 GG; bei Inlandsbezug Verstoß gegen ordre public (Art. 6 EGBGB). Benachteiligung weiblicher Erben (2:1) bei fehlendem Erblasserwillen ebenfalls gleichheitswidrig. **Aber:** Ein **nachweisbarer Erblasserwille**, dass das Ergebnis des ausländischen Rechts gelten soll, kann den ordre-public-Einwand entfallen lassen; strenge Beweisanforderungen; Zurückverweisung. Kein ordre-public-Verstoß allein durch fehlendes Pflichtteils-/Noterbrecht (so Kommentarlage). | Zentral für Teil 3: dokumentierter Wille zählt – aber nur innerhalb der Testierfreiheit; gesetzliche (Intestat-)Diskriminierung wird nicht angewandt | [V] Volltext-Seite lorenz.userweb.mwn.de |
| OLG Hamm, 1992 – 15 W 114/91 (IPRax 1994, 49) | Ungleichbehandlung nach iranischem Recht damals nicht als ordre-public-Verstoß gewertet; 2005 ausdrücklich abgerückt | historisch | [S] |
| OLG Düsseldorf, Beschl. v. 19.12.2008 – I-3 Wx 51/08 | Halbierter Erbteil von Töchtern nach iranischem Recht bei Inlandsbezug gleichheitswidrig, sofern nicht dem tatsächlichen Erblasserwillen entsprechend | wie OLG Hamm | [S] (IPRspr 2008-90) |
| **BGH, Urt. v. 29.06.2022 – IV ZR 110/21** (BGHZ 234, 166) | Gewähltes englisches Recht (Art. 22) wegen Art. 35 EuErbVO nicht angewandt, soweit Kind keinen bedarfsunabhängigen Pflichtteil erhält; Pflichtteil der Kinder Grundrechtsposition (Art. 14 i. V. m. Art. 6 GG); starker Inlandsbezug nötig; Lückenfüllung zuerst im ausländischen Recht, sonst deutsches Pflichtteilsrecht; nicht vorschnell verallgemeinern | Rechtswahl zugunsten eines Rechts ohne gleichwertigen Mindestschutz der Kinder ist bei Inlandsbezug riskant | [V] (lorenz.userweb.mwn.de) |
| BGH IV ZB 30/20 (vom Auftrag genannt) | **Nicht verifizierbar** – kein Treffer zu Inhalt/Islambezug. Nicht zitieren. | – | nicht verifiziert |
| BGH-Entscheidung zu einem **Testament**, das ausdrücklich auf islamische Erbregeln verweist bzw. Töchter testamentarisch halbiert | **Keine** solche Entscheidung gefunden. | Rechtsprechungslücke | **UNGEKLÄRT / anwaltlich zu prüfen** (juris/beck-online-Recherche nötig) |
| OLG München, Beschl. v. 23.09.2024 – 33 Wx 325/23 | Enterbungsklausel bei Heirat nicht sittenwidrig; Rspr. zu § 138 bei letztwilligen Verfügungen uneinheitlich | Zeigt Unsicherheit bei Bedingungen | [S] |

---

## Teil 2 – Islamisches Erbrecht (ʿilm al-farāʾiḍ) – Überblick für Produktlogik

> Hinweis: Darstellung zur **Bildungs-/Erklärfunktion**. Keine Fatwa, keine rechtliche Aussage. Schulmeinungen
> und regionale Rechtspraxis unterscheiden sich. Alle Rechenregeln brauchen Review durch qualifizierte Gelehrte
> (fachkundig in farāʾiḍ) **und** getrennt davon anwaltliche Prüfung der Umsetzung in deutsches Recht.

### 2.1 Koranische Grundlagen (paraphrasiert; Übersetzung „Sahih International“ auf quran.com)

- **4:11** (https://quran.com/4/11) [V]: Söhne erhalten den Anteil von zwei Töchtern; zwei oder mehr Töchter (ohne Söhne) teilen 2/3; eine Tochter allein 1/2; jeder Elternteil 1/6, wenn Kinder vorhanden; ohne Kinder und nur Eltern als Erben: Mutter 1/3; bei Geschwistern: Mutter 1/6; jeweils **nach** Vermächtnis und Schulden.
- **4:12** (https://quran.com/4/12) [V]: Ehemann 1/2 (ohne Kinder der Frau) bzw. 1/4 (mit Kindern); Ehefrau(en) 1/4 bzw. 1/8; *kalāla* mit einem Bruder/einer Schwester: je 1/6, mehrere teilen 1/3 – klassisch auf **Halbgeschwister mütterlicherseits** bezogen [K: diese Einordnung stammt aus Tafsir/fiqh, nicht aus dem Übersetzungstext]; „ohne Schaden zuzufügen“ (*ghayra muḍārrin*).
- **4:176** (https://quran.com/4/176) [V]: *kalāla* ohne Kinder: eine Schwester 1/2; zwei oder mehr Schwestern 2/3; Brüder und Schwestern gemeinsam: Bruder = zwei Schwestern; Bruder erbt alles von kinderloser Schwester (klassisch: voll- bzw. vaterseitige Geschwister [K]).
- Übersetzungsname auf der Seite nicht explizit angezeigt; Text entspricht Sahih International (translation id 20) – im Produkt über den Übersetzungsselektor bestätigen.

### 2.2 Reihenfolge der Abzüge (Konsens der sunnitischen Schulen, in Grundzügen auch Jaʿfari) [K]

1. **Tajhīz** – angemessene Bestattungskosten (Hanafi/Maliki/Shafi'i/Hanbali: vor Schulden, mit Ausnahme dinglich gesicherter Schulden – Details schulabhängig).
2. **Duyūn** – Schulden (gegenüber Menschen; Behandlung religiöser Schulden wie Zakat/Hajj schulabhängig, z. B. Hanafi nur bei Anordnung).
3. **Waṣiyya** – Vermächtnisse höchstens **1/3** des Restes; nicht an gesetzliche Erben, außer die übrigen Erben stimmen (nach dem Tod) zu. Hadith „lā waṣiyyata li-wārith“: Abū Dāwūd 2870 (sunnah.com: Hasan Sahih nach al-Albānī), at-Tirmidhī 2120 (Hasan), Ibn Māja 2713 [S – sunnah.com-Seiten über Suche gefunden, Wortlaut nicht im Detail geprüft]. Jaʿfari-Schule: Vermächtnis an Erben innerhalb 1/3 **zulässig** [K].
4. **Mīrāth** – Verteilung an Erben (Quotenerben, dann Residualerben).

Hinweis zum Rechner: Im deutschen Recht sind Nachlassverbindlichkeiten anders geordnet (§§ 1967 ff. BGB, Pflichtteile, Zugewinnausgleich); die islamische Reihenfolge ist nur Rechenlogik der **Wunschverteilung**.

### 2.3 Quotenerben (aṣḥāb al-furūḍ) – feste Anteile [K, Standardlehre]

| Anteil | Erben (vereinfacht) |
|---|---|
| 1/2 | Ehemann (keine Abkömmlinge); eine Tochter; eine Sohnestochter (ohne Tochter/Sohn); eine Vollschwester; eine vaterseitige Schwester (jeweils ohne blockierende/agnatisierende Erben) |
| 1/4 | Ehemann (mit Abkömmlingen); Ehefrau(en) (ohne Abkömmlinge) |
| 1/8 | Ehefrau(en) (mit Abkömmlingen) – mehrere Ehefrauen teilen |
| 2/3 | zwei+ Töchter; zwei+ Sohnestöchter; zwei+ Vollschwestern; zwei+ vaterseitige Schwestern |
| 1/3 | Mutter (keine Abkömmlinge, nicht mehrere Geschwister); zwei+ Halbgeschwister mütterlicherseits (gleich, ohne 2:1) |
| 1/6 | Vater/Großvater (mit Abkömmlingen); Mutter (mit Abkömmlingen oder mehreren Geschwistern); Großmutter(n); Sohnestochter neben einer Tochter (Ergänzung auf 2/3); vaterseitige Schwester neben einer Vollschwester; ein Halbgeschwister mütterlicherseits |

### 2.4 Residualerben (ʿaṣaba) [K]

- **ʿaṣaba bi-nafsihi** (männliche Agnaten, Rangfolge): Sohn, Sohnessohn …, Vater, väterlicher Großvater …, Vollbruder, vaterseitiger Bruder, deren Söhne, Onkel väterlicherseits, deren Söhne.
- **ʿaṣaba bi-ghayrihi**: Tochter mit Sohn, Sohnestochter mit Sohnessohn, Schwester mit Bruder (2:1).
- **ʿaṣaba maʿa ghayrihi**: Voll- bzw. vaterseitige Schwester(n) neben Tochter/Sohnestochter erhalten den Rest.
- Vater kann gleichzeitig Quotenerbe (1/6) und Residualerbe sein.

### 2.5 Ausschluss (ḥajb) [K]

- **ḥajb ḥirmān** (vollständiger Ausschluss): nähere Agnaten schließen entferntere aus (z. B. Sohn schließt Geschwister aus; Vater schließt Geschwister und Großvater aus). Nie ausgeschlossen: Ehegatten, Eltern, Sohn, Tochter.
- **ḥajb nuqṣān** (Minderung): z. B. Ehemann 1/2 → 1/4 durch Abkömmlinge; Mutter 1/3 → 1/6 durch Kinder oder mehrere Geschwister.

### 2.6 ʿAwl und Radd [K]

- **ʿAwl** (Sunniten): Summe der festen Anteile > 1 → Nenner wird erhöht, alle Quoten proportional gekürzt. Beispiel „al-Minbariyya“: Ehefrau 1/8, zwei Töchter 2/3, Vater 1/6, Mutter 1/6 → 27/24 → Nenner 27. **Jaʿfari: kein ʿawl**; Fehlbetrag geht zulasten bestimmter Erbinnen (Töchter/Schwestern).
- **Radd** (Rückfall eines Überschusses an Quotenerben, wenn keine ʿaṣaba): Hanafi/Hanbali: Radd an Quotenerben **außer Ehegatten**; klassisch Maliki/Shafi'i: Überschuss an Bayt al-Māl, spätere Schulmeinungen bei fehlender geordneter Staatskasse Radd wie Hanafi. Spätere Hanafi-Praxis/einige Staatsgesetze: Radd an Ehegatten nachrangig, wenn keine anderen Erben. **Jaʿfari**: Ehemann erhält Radd, wenn keine anderen Erben; Ehefrau nach herrschender Jaʿfari-Ansicht nicht.

### 2.7 Sonderfälle (im Rechner zu **blockieren** bzw. an Gelehrten-Review zu geben)

| Fall | Kurzbeschreibung | Schulunterschiede [K] |
|---|---|---|
| **al-ʿUmariyyatān / al-Gharrāwān** | Ehegatte + Vater + Mutter (ohne Kinder/Geschwister): Mutter erhält **1/3 des Restes** nach Ehegattenanteil (nicht 1/3 des Ganzen) | Mehrheit (Umar, vier Schulen) 1/3 des Restes; Ibn ʿAbbās: 1/3 des Ganzen |
| **al-Mushtaraka / al-Ḥimāriyya** | Ehemann 1/2, Mutter (oder Großmutter) 1/6, 2+ Halbgeschwister mütterlicherseits 1/3, Vollbruder(brüder) als Residualerben → Rest 0 | Maliki/Shafi'i (Umar): Vollgeschwister teilen das Drittel mit den Halbgeschwistern; Hanafi/Hanbali: Vollgeschwister erhalten nichts; Jaʿfari: anderes Klassensystem, Fall stellt sich so nicht |
| **Großvater mit Geschwistern** | Konkurrenz väterlicher Großvater ↔ Voll-/vaterseitige Geschwister | Abū Ḥanīfa (nach Abū Bakr): Großvater schließt Geschwister aus; Maliki/Shafi'i/Hanbali sowie Abū Yūsuf/Muḥammad (nach Zayd b. Thābit): gemeinsame Beteiligung (muqāsama bzw. günstigste Variante für Großvater) [S – ABU-Repository/Nurani-Artikel]; Jaʿfari: Großvater wie ein Bruder [K] |
| **al-Akdariyya** | Ehemann, Mutter, Großvater, Vollschwester | Sonderlösung Maliki/Shafi'i/Hanbali; Hanafi: Schwester ausgeschlossen |
| **Dhawū l-arḥām** (Verwandte, die weder Quoten- noch Residualerben sind, z. B. Tochterkinder, Tanten mütterlicherseits) | | Hanafi/Hanbali: erben subsidiär (Methoden: ahl al-qarāba vs. ahl al-tanzīl); klassisch Maliki/Shafi'i: Staatskasse (spätere Ansicht: erben); Jaʿfari: keine eigene Kategorie, über Klassen erfasst |
| **Jaʿfari-System insgesamt** | Drei Klassen (1. Eltern + Abkömmlinge; 2. Großeltern + Geschwister; 3. Onkel/Tanten); kein taʿṣīb, kein ʿawl; Tochter kann bei fehlenden Brüdern gesamten Nachlass (Fard + Radd) erhalten; Witwe erbt nach herrschender Ansicht nicht an Grund und Boden (nur Wert von Gebäuden etc.) | Eigenes Rechenwerk nötig – **im MVP blockieren** |
| Ungeborenes Kind (ḥaml), Verschollene (mafqūd), Intersex-Person (khunthā), gleichzeitiger Tod (gharqā/ḥadmā), Kettenerbfälle (munāsakhāt) | | Schulabhängig – blockieren |
| Kinder aus nichtehelicher Beziehung / liʿān; Adoptivkinder (kein Erbrecht, nur wasiyya) | Wichtiger Konflikt mit deutschem Recht (Adoptivkinder = volle Erben/Pflichtteil) | blockieren + Hinweis |

### 2.8 Erbhindernisse (mawāniʿ al-irth) [K]

- **Religionsverschiedenheit (ikhtilāf al-dīn)**: Nach Mehrheitsmeinung erben Muslim und Nichtmuslim nicht gegenseitig (Hadith u. a. al-Bukhārī 6764, Muslim 1614 [K, Nummern nicht verifiziert]). Jaʿfari: Muslim erbt vom Nichtmuslim, nicht umgekehrt; Minderheitsmeinungen (u. a. Muʿādh, Muʿāwiya) ähnlich. **Hohe Praxisrelevanz in Deutschland** (christliche/konfessionslose Ehefrau, nicht-muslimische Kinder/Eltern nach Konversion).
  - Waṣiyya an nichtmuslimische Angehörige innerhalb 1/3 nach Mehrheitsmeinung zulässig [K] → Brücke zum deutschen Pflichtteil (Teil 3).
  - Apostasie (ridda): Sonderregeln, stark umstritten → **blockieren**.
  - Deutsches Recht: Religionsverschiedenheit ist irrelevant; als gesetzliche Regel ausländischen Rechts ordre-public-widrig (OLG Hamm 15 W 117/04 [V]).
- **Tötung (qatl)**: Hanafi: vorsätzliche und bestimmte fahrlässige direkte Tötung schließt aus; Maliki: nur vorsätzliche/widerrechtliche Tötung; Shafi'i: grundsätzlich jede Tötung; Hanbali: Tötung mit Haftungsfolge [K]. Deutsches Pendant: Erbunwürdigkeit §§ 2339 ff. BGB (Anfechtungsklage nötig) [K].
- (Sklaverei – historisch, nicht relevant.)

### 2.9 Quellen Teil 2

- Koran 4:11, 4:12, 4:176 – quran.com, Übersetzung Sahih International [V].
- Hadith Abū Dāwūd 2870 (https://sunnah.com/abudawud:2870), Tirmidhī 2120 (https://sunnah.com/tirmidhi:2120) [S].
- Klassische Werke [K, bibliografisch, nicht online geprüft]: Sirāj al-Dīn al-Sajāwandī, *al-Farāʾiḍ al-Sirājiyya* (Hanafi; engl. Übers. A. Rumsey); Ibn al-Mutaqqina, *Matn al-Raḥbiyya* (Shafi'i); Ibn Qudāma, *al-Mughnī*, Kitāb al-Farāʾiḍ (Hanbali); Khalīl b. Isḥāq, *al-Mukhtaṣar* (Maliki); al-Muḥaqqiq al-Ḥillī, *Sharāʾiʿ al-Islām* (Jaʿfari).
- Akademische Überblicke [K]: N. J. Coulson, *Succession in the Muslim Family*, Cambridge UP 1971; D. S. Powers, *Studies in Qur'an and Hadith: The Formation of the Islamic Law of Inheritance*, 1986; M. Rohe, *Das islamische Recht*, C.H. Beck (3. Aufl. 2011); Bach, *Islamisches Recht vor deutschen Gerichten* (2019, Univ. Göttingen, PDF über Suche gefunden [S]).
- Großvater/Geschwister: ABU Zaria Repository „Analytical study of some cases of inheritance distribution in Maliki and other schools“; Nurani-Journal (Raden Fatah) „Ijtihad of the Companions … Grandfather's Inheritance“ [S].

### 2.10 Empfehlung Rechnerumfang (Produktsicht, nicht rechtlich bewertet)

- **MVP erlaubt nur**: eine sunnitische Schule je Berechnung (explizite Wahl, Default nur mit Gelehrten-Freigabe), Erben aus einer überschaubaren Liste (Ehegatte(n), Söhne, Töchter, Eltern, ggf. Geschwister), alle Erben als **muslimisch bestätigt**, keine Sonderfälle aus 2.7.
- **Hart blockieren** (mit Verweis auf Gelehrte + Anwalt): Jaʿfari; Religionsverschiedenheit/Apostasie; Tötungsverdacht; Großvater + Geschwister; Mushtaraka; Akdariyya; Dhawū l-arḥām; Radd mit Ehegatte; ḥaml, mafqūd, khunthā, gleichzeitiger Tod, Kettenerbfälle; Adoptiv-/nichteheliche Kinder; mehrere Ehefrauen (Rechtslage in DE: Mehrehe – **UNGEKLÄRT / anwaltlich zu prüfen**); Wasiyya an Erben; Auslandsvermögen in Drittstaaten.
- Jede Ausgabe kennzeichnen als „Bildungsrechnung, keine Fatwa, keine Rechtsauskunft, keine Aussage zur Wirksamkeit nach deutschem Recht“.
- Parallelanzeige: (a) gesetzliche Erbfolge nach BGB, (b) Pflichtteile, (c) islamische Bildungsrechnung – ohne Bewertung „richtig/wirksam“. Ob schon diese Parallelanzeige für eine konkrete Familie eine RDL ist: **UNGEKLÄRT / anwaltlich zu prüfen** (s. Smartlaw).

---

## Teil 3 – Wie kann der Wunsch „Ich möchte, dass mein Nachlass nach islamischen Erbgrundsätzen verteilt wird.“ im deutschen Recht wirksam werden?

> Alle folgenden Überlegungen sind **Optionen zur anwaltlichen Diskussion**, keine Empfehlungen. Jede Option:
> **UNGEKLÄRT / anwaltlich zu prüfen**. Es werden keine Musterklauseln formuliert.

### 3.1 Ausgangslage

- Für Muslime mit gewöhnlichem Aufenthalt in Deutschland gilt i. d. R. deutsches Erbrecht (Art. 21 EuErbVO) [S]. Ohne Testament: gesetzliche Erbfolge (§§ 1924 ff. BGB) – gleiche Anteile für Söhne und Töchter, Ehegatte nach § 1931/§ 1371 BGB, keine Religionsschranke.
- Islamische Verteilung ist daher nur über eine **wirksame Verfügung von Todes wegen** (Testament/Erbvertrag) erreichbar und findet ihre Grenzen in Form (§§ 2231 ff., 2247), Bestimmtheit/§ 2065, Pflichtteil (§§ 2303 ff.) und § 138 BGB.

### 3.2 Problemfelder des bloßen Verweises

1. **Auslegung/Bestimmtheit** (§§ 133, 2084 BGB [K]): Welche Schule? Welche Ansicht in Streitfällen (2.7)? Stichtag (Errichtung oder Tod)? Wer gilt als „Muslim“ (Religionsverschiedenheit)? Wie sind Stiefkinder/Adoptivkinder zu behandeln? Ein Nachlassgericht müsste den Inhalt ggf. per Gutachten ermitteln.
   - In der Literatur wird die Möglichkeit einer **materiellrechtlichen Verweisung** (Inkorporation fremder Regeln in den Testamentsinhalt) diskutiert [K]. Ob eine Verweisung auf **nichtstaatliche religiöse Normen** hinreichend bestimmt ist: **UNGEKLÄRT / anwaltlich zu prüfen**; keine einschlägige Entscheidung gefunden.
2. **§ 2065 Abs. 2 BGB** [V]: Soll ein Imam/Gelehrter festlegen, wer was erhält, überlässt der Erblasser die Bestimmung der Bedachten bzw. Anteile einem Dritten – für Erbeinsetzungen grundsätzlich unzulässig. Diskutiert wird eine Ausnahme, wenn der Dritte nur nach so präzisen Kriterien „bezeichnet“, dass jede sachkundige Person zum selben Ergebnis käme [K]; bei schulabhängigen Streitfragen fraglich. **UNGEKLÄRT / anwaltlich zu prüfen**.
3. **Rechtswahl (Art. 22 EuErbVO)** [S]: Nur das Recht eines Staates der eigenen Staatsangehörigkeit, **nicht „Scharia“**. Deutsche Staatsangehörige ohne weitere Staatsangehörigkeit haben keine Wahlmöglichkeit hin zu islamischem Erbrecht. Türkische, bosnische Staatsangehörige: Heimatrecht säkular – Wahl erreicht das Ziel nicht.
4. **Pflichtteil** bleibt bestehen (Geldanspruch), unabhängig von der Verteilung.
5. **Zeitlücke**: Familie ändert sich (Geburt, Tod, Heirat, Scheidung, Konversion); feste Quoten passen später nicht; § 2079 BGB-Anfechtung bei übergangenen Pflichtteilsberechtigten.

### 3.3 Illustrative Pflichtteilskonflikte (nur Quotenvergleich, keine Wertberechnung)

Annahmen: deutsches Erbstatut, alle Beteiligten muslimisch (außer wo genannt), keine Vorempfänge, Zugewinngemeinschaft, sunnitische Mehrheitsregeln. **Rechenbeispiele vereinfacht, anwaltlich zu prüfen.**

| Konstellation | Islamische Quote | Gesetzl. Erbteil (BGB) | Pflichtteil | Konflikt? |
|---|---|---|---|---|
| Ehefrau, 1 Sohn, 1 Tochter | Ehefrau 1/8; Sohn 7/12; Tochter 7/24 | Ehefrau 1/2 (1/4 + 1/4 nach § 1371 Abs. 1); Kinder je 1/4 | Ehefrau 1/4; Kinder je 1/8 | **Ehefrau**: 1/8 < 1/4 → Pflichtteilsrest (§ 2305) bzw. Wahl güterrechtliche Lösung (§ 1371 Abs. 2, 3) [K]; Tochter 7/24 > 1/8 → kein Konflikt |
| n Söhne, k Töchter, kein Ehegatte | Tochter je 1/(2n+k) | je 1/(n+k) | je 1/(2(n+k)) | Tochter liegt rechnerisch **nicht unter** ihrem Pflichtteil, da 2n+k ≤ 2n+2k |
| Ehemann, 1 Tochter, Vater, Mutter | ʿawl auf 13: Ehemann 3/13, Tochter 6/13, Eltern je 2/13 | Ehemann 1/2; Tochter 1/2 | Ehemann 1/4; Tochter 1/4 | **Ehemann** 3/13 ≈ 0,23 < 0,25 → Konflikt; Eltern (bei Abkömmlingen nicht pflichtteilsberechtigt) erhalten etwas, was nach BGB nicht vorgesehen ist – zulässig über Testierfreiheit |
| Nichtmuslimische Ehefrau, 2 Kinder | Ehefrau 0 (Mehrheitsmeinung) | Ehefrau 1/2 | Ehefrau 1/4 (oder Zugewinnausgleich + 1/8) | **Konflikt**: voller Pflichtteils- und ggf. Zugewinnanspruch |
| Nichtmuslimisches Kind | 0 | wie Geschwister | Hälfte | **Konflikt** |

Lesart: Der Hauptkonflikt betrifft typischerweise **Ehegatten** (insb. bei Zugewinngemeinschaft) und **nichtmuslimische Angehörige**, weniger die 2:1-Verteilung zwischen Söhnen und Töchtern. Das ist eine rechnerische Beobachtung, keine rechtliche Bewertung.

### 3.4 Sittenwidrigkeit (§ 138 BGB) der ungleichen Verteilung

- Ausgangspunkt: Testierfreiheit erlaubt grundsätzlich auch ungleiche Verteilung; Sittenwidrigkeit letztwilliger Verfügungen wird von der Rechtsprechung nur in schwerwiegenden Ausnahmefällen angenommen (Grundsatz u. a. referiert bei OLG Düsseldorf I-3 Wx 100/08 [S]); Mindestschutz der Familie läuft über das Pflichtteilsrecht.
- BVerfG 1 BvR 2248/01 [S]: Grundrechtsrelevanz vor allem, wenn Bedingungen **Druck** auf höchstpersönliche Entscheidungen (Ehe) ausüben – übertragbar auf religionsbezogene Bedingungen (Art. 4 GG)?
- OLG Hamm 15 W 117/04 [V]: Ein tatsächlich vorhandener Erblasserwille zur ungleichen/religionsbezogenen Verteilung kann den ordre-public-Einwand gegenüber ausländischem Intestat-Recht beseitigen – deutet darauf hin, dass gewillkürte Ungleichverteilung grundsätzlich respektiert wird.
- Eine deutsche Entscheidung, die ein Testament mit **ausdrücklich islamisch begründeter** 2:1-Verteilung oder Ausschluss nichtmuslimischer Angehöriger auf § 138 BGB prüft, wurde **nicht gefunden**. → **UNGEKLÄRT / anwaltlich zu prüfen**.
- Besonderes Risiko: Verfügungen, die an Religionszugehörigkeit/-wechsel **anknüpfen** (Bedingungen, Verwirkungsklauseln) – nicht anbieten, bis anwaltlich geklärt.

### 3.5 Strukturoptionen (alle: **UNGEKLÄRT / anwaltlich zu prüfen**)

**Option A – Bloßer Verweis auf „islamische Erbgrundsätze“**
- Vorteile: einfach; bildet den Wunsch wörtlich ab; dokumentiert Motiv.
- Nachteile: Bestimmtheits- und Auslegungsrisiko; § 2065-Risiko bei Gelehrtenbestimmung; Schul-/Streitfragen offen; Nachlassgericht braucht Gutachten; Pflichtteile bleiben; Streitpotenzial hoch.
- Produktfolge: Portal sollte einen bloßen Verweis nicht als „fertige Lösung“ darstellen.

**Option B – Rechtswahl nach Art. 22 EuErbVO zugunsten eines islamisch geprägten Heimatrechts** (nur für entsprechende Staatsangehörige)
- Vorteile: staatliches, ermittelbares Recht; ggf. dort anerkannt (Immobilien im Heimatstaat).
- Nachteile: nur für bestimmte Staatsangehörige; gewähltes Recht bringt **eigene Grenzen** (z. B. Wasiyya-Grenzen, Pflichtteils-/Noterbrechte, staatliche Sonderregeln wie „wasiyya wājiba“ in Ägypten [K]); ordre-public-Kontrolle (Art. 35; BGH IV ZR 110/21 [V]; OLG Hamm 15 W 117/04 [V]); Bindung in gemeinschaftlichem Testament (§ 2270 Abs. 3 [V]); Nachweis fremden Rechts teuer.
- Produktfolge: höchstens Hinweis „sprechen Sie mit Anwalt über Rechtswahl“, keine Auswahlhilfe.

**Option C – Konkrete Erbquoten nach deutschem Recht, zum Errichtungszeitpunkt islamisch berechnet, plus Ersatzregelungen**
- Inhalt (beschreibend): Erbeinsetzung der namentlich benannten Personen zu konkreten Bruchteilen; Ersatzerben (§ 2096 BGB [K]); ggf. Anwachsungsregeln (§ 2094 [K]); Motivangabe zur Auslegungshilfe.
- Vorteile: hohe Bestimmtheit; kein § 2065-Problem; Nachlassgericht kann ohne Islam-Gutachten entscheiden.
- Nachteile: veraltet bei Familienänderung → regelmäßiger Review nötig; Pflichtteile bleiben; Wahl der Schule/Streitfragen muss **beim Entwurf** entschieden werden (Gelehrten-Review); eigenhändiges Abschreiben fehleranfällig.
- Produktfolge: Bildungsrechner liefert Ausgangsquoten → anwaltliche/notarielle Umsetzung; Erinnerungsfunktion bei Lebensereignissen.

**Option D – Konkrete Quoten + Anpassungsmechanismus**
- Varianten zur Diskussion: (i) bedingte Alternativverteilungen für vorhersehbare Ereignisse (Geburt weiterer Kinder, Vorversterben); (ii) Vermächtnisse mit zulässiger Drittbestimmung (§§ 2151, 2153, 2156 [K]); (iii) Teilungsanordnung/Auseinandersetzung nach billigem Ermessen eines Dritten (§ 2048 S. 2 [K]); (iv) Testamentsvollstrecker mit Auseinandersetzungsaufgabe (§§ 2203 ff. [K]).
- Vorteile: Flexibilität ohne volle Drittbestimmung bei Erbeinsetzung.
- Nachteile: Abgrenzung zu § 2065 Abs. 2 heikel; Komplexität; Kosten Testamentsvollstreckung.
- **UNGEKLÄRT / anwaltlich zu prüfen**: Wie weit ein Dritter (z. B. Gelehrter/Testamentsvollstrecker) bei Vermächtnis/Teilung nach islamischen Kriterien bestimmen darf.

**Option E – Deutsche Grundstruktur (z. B. gesetzliche oder gleichmäßige Erbfolge) + Vermächtnisse/Wasiyya-Drittel**
- Idee: Erbquoten näher am deutschen Recht (pflichtteilsfest), ergänzt um Vermächtnisse, die das islamische Ergebnis teilweise nachbilden, oder Vermächtnisse an nichtmuslimische Angehörige (islamisch über Wasiyya ≤ 1/3 vertretbar [K]).
- Vorteile: geringeres Pflichtteils-/Streitrisiko; Brücke für gemischtreligiöse Familien.
- Nachteile: Ergebnis entspricht nicht 1:1 den farāʾiḍ; religiöse Akzeptanz klären (Gelehrte).

**Option F – Lebzeitige Flankierung**
- Pflichtteilsverzicht (§ 2346 Abs. 2 BGB [V]) – **notarielle Beurkundung** erforderlich (§ 2348 BGB [V]); ggf. gegen Abfindung; freiwillig, ggf. Wirksamkeitskontrolle bei Ungleichgewicht [K].
- Erbvertrag (§§ 2274 ff., notarielle Form § 2276 [K]) für Bindung mit Familie.
- Ehevertrag/Güterstandswahl (z. B. Gütertrennung, § 1414 [K]) – verändert Ehegattenerbteil/Pflichtteil; Nebenwirkungen (Steuer, Unterhalt) beachten.
- Schenkungen: Pflichtteilsergänzung (§ 2325 [K]).
- Vorteile: kann Pflichtteilskonflikte rechtssicher entschärfen. Nachteile: Mitwirkung der Betroffenen, Notarkosten, familiärer Druck (Freiwilligkeit!).

**Option G – Akzeptierte Restrisiken**
- Testament nach islamischen Quoten mit bewusster Inkaufnahme von Pflichtteilsansprüchen (Geldanspruch, Verjährung §§ 195, 199 BGB [K]); Hinweis an Familie.
- Vorteil: einfach. Nachteil: Streit, Liquiditätsbedarf der Erben (Immobilien).

**Querschnitt für alle Optionen**
- Dokumentation des Erblasserwillens (Motiv) kann Auslegung stützen (vgl. OLG Hamm 15 W 117/04 [V] zur Bedeutung des tatsächlichen Willens) – Form und Inhalt: **anwaltlich zu prüfen**.
- Vormundbenennung (§ 1782 BGB [V]) unabhängig von der Verteilungsfrage einplanen.
- Auslandsimmobilien: Nachlassspaltung prüfen (Türkei: Nachlassabkommen § 14 [S]).
- Mehrsprachigkeit (Testament auf Arabisch/Türkisch) – Auslegungs-/Übersetzungsrisiko [K].
- Bestattungswünsche (Auflage/Totenfürsorge) – sinnvoll **zusätzlich** außerhalb des Testaments, da Testamentseröffnung oft nach der Bestattung erfolgt [K].

### 3.6 Abgeleitete Produktleitplanken (zur anwaltlichen Bestätigung)

1. Kein Generator eines „fertigen Testaments“; Ausgabe als **Vorbereitungs-/Gesprächsunterlage**.
2. Kein Ausdruck, der wie ein unterschriftsreifes Testament wirkt (Formnichtigkeit § 2247).
3. Keine individuelle Wirksamkeitsaussage („Ihr Testament ist wirksam/pflichtteilsfest“) – RDL-Risiko (§ 2 RDG; Smartlaw).
4. Islamischer Rechner: Bildungsfunktion, Schule explizit, Sonderfälle blockiert, Gelehrten-Review dokumentiert.
5. Anwalts-Review: kein Provisionsmodell (§ 49b Abs. 3 BRAO; § 27 BORA); Mandat direkt zwischen Nutzer und Anwalt.
6. Art.-9-DSGVO-Konzept inkl. Daten Dritter, DSFA, AVV.

---

## Anhang – Quellenverzeichnis mit Prüfstatus

**Primärquellen abgerufen [V]**
- § 2247 BGB – https://www.gesetze-im-internet.de/bgb/__2247.html
- § 2065 BGB – https://www.gesetze-im-internet.de/bgb/__2065.html
- § 1782 BGB – https://www.gesetze-im-internet.de/bgb/__1782.html
- § 2270 BGB – https://www.gesetze-im-internet.de/bgb/__2270.html
- § 2346 BGB – https://www.gesetze-im-internet.de/bgb/__2346.html
- § 2348 BGB – https://www.gesetze-im-internet.de/bgb/__2348.html
- § 2 RDG – https://www.gesetze-im-internet.de/rdg/__2.html
- § 5 RDG – https://www.gesetze-im-internet.de/rdg/__5.html
- § 49b BRAO – https://www.gesetze-im-internet.de/brao/__49b.html
- BGH I ZR 113/20 (Smartlaw) – https://gesetze.co/urteile/I_ZR_113-20 (Volltextportal; Datumsangabe dort 08.09., übrige Quellen 09.09.2021)
- BGH IV ZR 110/21 – https://lorenz.userweb.mwn.de/urteile/ivzr110_21.htm
- OLG Hamm 15 W 117/04 – https://lorenz.userweb.mwn.de/urteile/15w117_04.htm
- Koran 4:11, 4:12, 4:176 – https://quran.com/4/11 , https://quran.com/4/12 , https://quran.com/4/176

**Nur sekundär bestätigt [S]**
- EuErbVO Art. 21, 22, 34, 35, 75 – EUR-Lex nicht auswertbar; Inhalte über haufe.de, iww.de, justiz.nrw (https://www.justiz.nrw/BS/rechtimausland/internationales-erbrecht)
- BVerfG 1 BvR 2248/01 – haufe.de, rechtsanwalt-krau.de; Fundstelle NJW 2004, 2008/2088 widersprüchlich
- BGH IV ZB 19/97 (BGHZ 140, 118) – haufe.de
- OLG Düsseldorf I-3 Wx 51/08, I-3 Wx 100/08; OLG Hamm 15 W 114/91; OLG München 33 Wx 325/23 – Snippets/IPRspr
- Deutsch-türkisches Nachlassabkommen § 14 – haufe.de, rechtslupe.de; BGH IV ZR 68/15
- Deutsch-iranisches Niederlassungsabkommen – haufe ZErb 10/2015 (Titel)
- § 27 BORA – über BGH III ZR 56/07 (rewis.io); Wortlaut nicht abgerufen
- LTO/beck-aktuell zu Smartlaw – https://www.lto.de/recht/juristen/b/bgh-urteil-izr11320-vertragsgenerator-smartlaw-keine-unzulaessige-rechtsdienstleistung-rak-hamburg-rdg-legal-tech
- Hadith Abū Dāwūd 2870, Tirmidhī 2120 – sunnah.com
- Großvater/Geschwister-Schulunterschiede – kubanni.abu.edu.ng; jurnal.radenfatah.ac.id

**Nicht verifiziert / aus Fachwissen [K]** – vor Verwendung prüfen
- Übrige BGB-Normen (§§ 1371, 1924 ff., 1931, 2048, 2074 ff., 2077–2079, 2087, 2094, 2096, 2150–2156, 2192 ff., 2197 ff., 2231, 2232, 2248, 2253 ff., 2265 ff., 2269, 2271, 2274 ff., 2303 ff., 2325, 2333, 2339 ff.), BeurkG, BNotO-Register-Normen, Art. 26 EGBGB, DSGVO Art. 6, 9, 28, 32, 35
- BGHZ 15, 199 (Drittbestimmung)
- Ägyptische Gesetze Nr. 77/1943, 71/1946; Moudawana Buch VI; bosnisches Erbrecht
- Hadith-Nummern Bukhārī 6764 / Muslim 1614 (Religionsverschiedenheit)
- Klassische Werke und akademische Literatur (Teil 2.9)
- Sämtliche farāʾiḍ-Detailregeln und Schulunterschiede in 2.2–2.8, soweit nicht oben als [S] markiert

**Nicht auffindbar / nicht zitieren**
- „BGH IV ZB 30/20“ – Inhalt/Islambezug nicht verifizierbar
- Deutsche Entscheidung zu einem Testament mit ausdrücklichem Verweis auf islamische Erbregeln – nicht gefunden
