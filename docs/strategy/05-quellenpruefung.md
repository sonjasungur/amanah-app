# Quellenprüfung Wissensbereich – amanah-app („Mein Wille“)

Prüfdatum: 2026-10-30 · Branch `feat/vorsorge-testament-foundation` · nur lesend, keine Projektdatei geändert.
Geprüft: `src/lib/knowledge/sources.ts`, `src/lib/knowledge/quran-verses.ts`, alle zitierenden Stellen in `src/lib/knowledge/*.ts`, `src/lib/inheritance/*.ts`, `src/components/marketing/akhira-section.tsx`. Altes Audit `docs/content-source-audit.md` (2026-07-14) gelesen. Es bewertet alle Einträge mit „korrekt: ja“, das ist **nicht haltbar** (siehe unten).

## Methode und Belege

| Prüfung | Werkzeug/Quelle | Ergebnis |
|---|---|---|
| Qur'an-Wortlaut Bubenheim/Elyas | QuranEnc-API `https://quranenc.com/api/v1/translation/aya/german_bubenheim/<s>/<v>` (curl) | alle 8 Verse abgerufen |
| QuranEnc-Browse-URL der Records | `curl https://quranenc.com/en/browse/german_bubenheim/4/11` | HTTP 200 |
| Hadith sunnah.com | curl und WebFetch | **HTTP 403** (Bot-Sperre), direkter Abruf nicht möglich |
| Hadith-Ersatzquelle | `cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{eng,ara}-bukhari/<n>.json`, Bukhari-Nummerierung = Standardnummerierung wie auf sunnah.com (Kapitel/In-book-Ref. mitgeliefert) | Bukhari 1254, 1273, 1295, 1315 (arab.), 1316, 1323–1325, 2289, 2738, 2742–2744 abgerufen |
| Muslim (Abd-al-Baqi-Nummerierung mit Buchstaben) | ihadis.com (spiegelt sunnah.com-Referenzen inkl. In-book/USC-MSA), Websuche | 944c, 977a, 1628a, 1631 bestätigt |
| Tirmidhi | hadith-api `eng-tirmidhi/1054` (inkl. Gradierungen) | abgerufen |
| Offizielle URLs | `curl -L` mit Browser-UA | Statuscodes siehe Tabelle 3 |

Hinweis: Kein Record enthält `arabicText` (Feld existiert nur in `src/lib/types.ts:61`). Kein Hadith-Record hat ein Gradierungsfeld; die Echtheit ergibt sich nur implizit aus `auditCategory: "SAHIH_PRIMARY"`. Für Bukhari/Muslim ist das ausreichend (sahih per Definition), für die unten empfohlene Tirmidhi-Referenz wäre eine Gradierung Pflicht.

---

## 1. Qur'an-Records (`quran-verses.ts`, alle mit `translator: "Bubenheim & Elyas"`, `isParaphrase: false`)

Grundbefund: Die Datei behauptet im Kopf „German text is the licensed Bubenheim/Elyas translation; do not paraphrase“ und „verified against QuranEnc german_bubenheim“. **Keiner der 7 Texte ist wortgleich mit Bubenheim/Elyas.** Alle sind Umformulierungen, teils gekürzt, teils mit Bedeutungsfehlern. `isParaphrase: false` und die Attribution „Keine inhaltliche Umformulierung“ (`QURAN_ATTRIBUTION`) sind damit bei allen 7 falsch.

| ID | Stelle existiert? | Abgleich mit Bubenheim/Elyas (QuranEnc) | Klasse | Was genau korrigieren |
|---|---|---|---|---|
| `quran-nisa-4-11` | ja | **Schwerer Bedeutungsfehler:** Record: „Dem männlichen Geschlecht das Gleiche wie dem weiblichen Geschlecht von dem, was die Eltern und nächsten Verwandten hinterlassen.“ Bubenheim: „Einem männlichen Geschlechts kommt ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts.“ Der Record kehrt die 2:1-Regel in Gleichverteilung um. „Eltern und nächsten Verwandten hinterlassen“ stammt sinngemäß aus 4:7, nicht aus 4:11. Rest umformuliert („vorgeschrieben“ statt „empfiehlt“, „Gewiss … Allweise“ ähnlich). | KORREKTUR NÖTIG (kritisch) | Wortlaut 1:1 aus QuranEnc übernehmen. Widerspricht zudem dem eigenen Artikel `erbe-faraid` („Söhne erhalten doppelt so viel wie Töchter“) und der Berechnungslogik in `src/lib/inheritance/`, die 4:11 zitiert. |
| `quran-nisa-4-12` | ja | Reihenfolge vertauscht (Record beginnt mit den Frauen, Bubenheim mit den Ehemännern). Zweite Vershälfte (Kalala-Halbgeschwister mütterlicherseits je 1/6, mehrere teilen 1/3, „ohne Schädigung“, „anbefohlen von Allah. Allah ist Allwissend und Nachsichtig“) **ohne Auslassungszeichen weggelassen**. Inhaltlich zu den Ehegattenanteilen (1/4, 1/8, 1/2, 1/4) korrekt. | KORREKTUR NÖTIG | Wortlaut übernehmen; bei Kürzung „…“ und Hinweis „Auszug“. |
| `quran-nisa-4-176` | ja | Gekürzt und mit Glosse versehen: „Kalala (den, der keine direkten Erben hat)“ statt „Erbanteil seitlicher Verwandtschaft“; „Wenn jemand stirbt“ statt „Wenn ein Mann umkommt“; Schluss (gemischte Geschwister 2:1, „Allah gibt euch Klarheit …“) fehlt ohne Kennzeichnung. Die Glosse „keine direkten Erben“ ist ungenau (klassisch: weder Kinder noch Vater). | KORREKTUR NÖTIG | Wortlaut übernehmen; Erläuterung als `note` getrennt halten. |
| `quran-al-imran-3-185` | ja | Bedeutung stimmt grob. Abweichungen: „erst am Tag der Auferstehung“ → „am Tag …“ (das „erst“ fehlt und ist theologisch relevant), „in vollem Maß zukommen“ → „vollständig ausgezahlt“, „(Höllen)feuer entrückt“ → „vom Feuer ferngehalten“. Schluss grammatisch fehlerhaft: „nur genießbarer Täuschung“ (Bubenheim: „nur trügerischer Genuß“). | KORREKTUR NÖTIG | Wortlaut übernehmen. |
| `quran-al-muminun-23-99` (23:99–100) | ja | Bedeutung stimmt. Formulierung abweichend: „sende mich zurück“ (B.: „bringt mich zurück“, Plural im Original), „damit ich Gutes tue“ (B.: „auf daß ich rechtschaffen handele“), „Barriere“ (B.: „trennendes Hindernis“), „Hinter ihnen liegt“ (B.: „wird … sein“). `url` zeigt nur auf Vers 99. | KORREKTUR NÖTIG | Wortlaut beider Verse übernehmen oder `isParaphrase: true`. |
| `quran-ash-shura-42-38` | ja | Bedeutung stimmt. Umformuliert („Und diejenigen“ statt „und diejenigen“, Klammerzusätze von Bubenheim entfernt). Der Vers ist im Original ein Satzfragment (Fortsetzung von 42:36–37). | KORREKTUR NÖTIG (gering) | Wortlaut übernehmen. Die Zitierung im Topic `w-familie` ist mit der vorhandenen Note („nicht als spezifische Vorsorgeregel“) vertretbar. |
| `quran-al-hashr-59-18` | ja | Bedeutung stimmt, nahezu wörtlich, aber abweichend: „O ihr Gläubigen“ (B.: „O die ihr glaubt“), „jeder soll sehen, was er“ (B.: „eine jede Seele schaue, was sie“). | KORREKTUR NÖTIG (gering) | Wortlaut übernehmen. |

Lizenz: Ob die Bubenheim/Elyas-Übersetzung über QuranEnc für die App lizenziert ist, ist **NICHT VERIFIZIERBAR** (keine Lizenzdatei/-notiz im Repo gefunden; Nutzungsbedingungen von QuranEnc nicht geprüft). Solange der Text nicht wörtlich ist, darf er ohnehin nicht als „Übersetzung Bubenheim & Elyas“ ausgewiesen werden.

---

## 2. Hadith-Records (`sources.ts`)

| ID | Referenz im Record | Tatsächlicher Inhalt der Referenz (geprüft) | Inhalt passt? | Gradierung | Klasse | Was genau korrigieren |
|---|---|---|---|---|---|---|
| `hadith-janazah-hasten` | Bukhari 1315 · Muslim 944c | Bukhari 1315 (Kitab al-Jana'iz, In-book 23/72, Abu Huraira): „أَسْرِعُوا بِالْجِنَازَةِ …“, arabischer Text abgerufen. Muslim 944c (Buch 11, In-book 66, USC-MSA 2061) gleicher Inhalt (ihadis.com/Suche). | ja. Deutsche Wiedergabe sinngemäß, `isParaphrase: true` korrekt. | Sahih (Bukhari/Muslim) | KORREKT | Optional: Gradierung explizit ausweisen. |
| `hadith-bukhari-janazah-1254` | Bukhari 1254 | Bukhari 1254 (In-book 23/16) = Umm ʿAtiyya: **Waschung der Tochter des Propheten** (Ghusl mit Wasser und Sidr, Kampfer). Der Qirat-Hadith steht in **Bukhari 1325** (In-book 23/81, Abu Huraira: ein Qirat für das Gebet, zwei Qirat bis zur Beerdigung, „wie zwei große Berge“). | **nein**, falsche Nummer | Sahih | KORREKTUR NÖTIG | Referenz auf Bukhari 1325 ändern (verifiziert; Muslim-Parallele nicht geprüft). Achtung: Die Wiedergabe sagt „Wer einer Leichenbegleitung folgt und das Janazah-Gebet verrichtet“. 1325 lautet: „bis er das Gebet verrichtet … wer sie bis zur Beerdigung begleitet“. Text nachziehen. |
| `hadith-bukhari-janazah-1273` | Bukhari 1273 | Bukhari 1273 (In-book 23/34) = ʿAisha: Der Prophet wurde **in drei weiße Tücher gehüllt** (Kafan). Der zitierte Gräberbesuch-Hadith steht **nicht in Bukhari**, sondern in **Muslim 977a** (Buraida: „Ich hatte euch den Besuch der Gräber verboten, nun besucht sie“, ohne den Zusatz „erinnern an das Jenseits“). Der Zusatz „denn sie erinnern an das Jenseits“ steht in **Tirmidhi 1054** (laut hadith-api: al-Albani „Sahih“, Bashar Awad Maʿruf „Hasan Sahih“; auf sunnah.com wegen 403 nicht gegengeprüft). | **nein**, falsche Sammlung und Nummer | – | KORREKTUR NÖTIG | ID, Titel, `collection`, `hadithNumber`, `url` ändern: entweder Muslim 977a mit gekürzter Wiedergabe (ohne „Jenseits“-Zusatz) oder Tirmidhi 1054 **mit** Gradierungsangabe (dann nicht `SAHIH_PRIMARY`, da nicht Bukhari/Muslim). Bukhari 1273 passt zum Topic Ghusl/Kafan, nicht zu Janazah-Beschleunigung. |
| `hadith-sadaqa-jariya` | Muslim 1631 | Muslim 1631 (Kitab al-Wasiyya, In-book 25/20, Abu Huraira): Taten enden außer drei: fortlaufende Sadaqa, nützliches Wissen, rechtschaffenes Kind, das für ihn bittet. | ja, sinngemäß korrekt, `isParaphrase: true` | Sahih | KORREKT | – |
| `hadith-wasiyyah-third` | Bukhari 2742 · Muslim 1628a | Bukhari 2742 (In-book 55/5, Saʿd): „Ein Drittel, und selbst ein Drittel ist viel.“ Muslim 1628a (Buch 25, In-book 6, USC-MSA 3991): gleiche Saʿd-Erzählung. | ja | Sahih | KORREKT | – |
| `hadith-wasiyyah-saad` | Bukhari 2738 | Bukhari 2738 (In-book 55/1, Ibn ʿUmar) = **Pflicht, das Testament schriftlich bereitzuhalten** („nicht zwei Nächte ohne geschriebenes Testament“). Die Saʿd-Erzählung steht in **Bukhari 2742** (bereits in `hadith-wasiyyah-third`), **2744** und **1295**. | **nein**, falsche Nummer | Sahih | KORREKTUR NÖTIG | Auf Bukhari 2744 oder 1295 ändern (beide verifiziert), oder Record mit `hadith-wasiyyah-third` zusammenlegen (Dublette 2742). Wiedergabe „fast sein gesamtes Vermögen“: 1295 nennt zwei Drittel, 2742 „alles“, 2744 „die Hälfte“. An gewählte Nummer anpassen. Bukhari 2738 wäre als eigener Beleg für „Testament schriftlich vorbereiten“ nützlich. |
| `hadith-debts-deceased` | Bukhari 2289 | Bukhari 2289 (In-book 38/3, Salama ibn al-Akwaʿ): drei Verstorbene. Beim dritten (Schulden 3 Dinar, kein Vermögen) verweigert der Prophet das Gebet: „Betet für euren Gefährten“. Abu Qatada bietet an, die Schuld zu zahlen, daraufhin betet er. | teilweise | Sahih | KORREKTUR NÖTIG (gering) | Wiedergabe „fragte, wer die Schulden für ihn übernehmen würde“ steht so nicht im Text. Korrekt wäre: Er verweigerte zunächst das Totengebet („Betet für euren Gefährten“), bis Abu Qatada die Schuld übernahm. |

Gradierung: Bei allen 7 Records fehlt ein explizites Gradierungsfeld. Bei Bukhari/Muslim ist das unkritisch. Ein Tirmidhi-Ersatz (s. o.) braucht eine Gradierung.

---

## 3. Sonstige Quellen

| ID | Typ | Referenz/URL | Prüfung | Klasse | Was genau korrigieren |
|---|---|---|---|---|---|
| `fiqh-ghusl-kafan` | fiqh | „Klassische Fiqh-Literatur — fachlich prüfen“ | Kein Werk, kein Band, keine Seite | KORREKTUR NÖTIG (Referenz unspezifisch) | Konkretes Werk + Kapitel (Gelehrtenreview). Alternativ verifizierte Primärbelege: Bukhari 1254 (Ghusl, Umm ʿAtiyya) und Bukhari 1273 (drei weiße Tücher), beide oben verifiziert. |
| `fiqh-janazah-basics` | fiqh | dto. | dto. | KORREKTUR NÖTIG (Referenz unspezifisch) | dto. |
| `official-patientenverfuegung-bmj` | official | `https://www.bundesgesundheitsministerium.de/themen/pflege/patientenverfuegung.html` | **HTTP 404** (nach Redirect auf `/patientenverfuegung`). Zudem passt die ID (`-bmj`) nicht zum Titel („Bundesministerium für Gesundheit“). | KORREKTUR NÖTIG | Erreichbare Alternative (HTTP 200 geprüft): `https://www.bmj.de/DE/themen/vorsorge_betreuungsrecht/patientenverfuegung/patientenverfuegung_node.html` (leitet auf bmjv.de weiter). Inhalt der Seite nicht im Detail geprüft. Titel/ID angleichen. |
| `official-patientenverfuegung-vz` | official | `https://www.verbraucherzentrale.de/wissen/gesundheit-pflege/patientenverfuegung-13921` | **HTTP 404** | KORREKTUR NÖTIG | Neue URL ermitteln (nicht ermittelt, nicht geraten). |
| `official-vorsorgevollmacht` | official | `https://www.bmjv.de/DE/themen/familie_und_partnerschaft/vorsorgevollmacht/vorsorgevollmacht_node.html` | **HTTP 404**. Dieselbe tote URL steht auch in `entries.ts:61`, die BMG-URL in `entries.ts:77`. | KORREKTUR NÖTIG | Erreichbar (HTTP 200): `https://www.bmj.de/DE/themen/vorsorge_betreuungsrecht/vorsorgevollmacht/vorsorgevollmacht_node.html` |
| `partner-gemeinsam1-sadaqa` | official | `https://gemeinsam1.de/?utm_…` | HTTP 200 | KORREKT (mit Hinweis) | `type: "official"` für einen Partnerlink ist irreführend. Die Kennzeichnung im Text ist vorhanden. |

---

## 4. Zitierende Stellen, die mehr behaupten als die Quelle trägt

| Datei / Artikel | Behauptung | Zitierte Quelle(n) | Problem |
|---|---|---|---|
| `wissen-topics.ts` `w-janazah` | Janazah-Wünsche, Beschleunigung, Belohnung, Gräberbesuch | `hadith-bukhari-janazah-1254`, `-1273` | Beide Nummern belegen tatsächlich Ghusl bzw. Kafan, nicht Qirat bzw. Gräberbesuch (s. o.). |
| `testament-erbe.ts` `erbe-faraid` | „Söhne erhalten doppelt so viel wie Töchter“ | `quran-nisa-4-11` | Aussage stimmt mit dem Qur'an überein, **widerspricht aber dem im Record angezeigten Text** (Gleichverteilung). Nutzer sehen widersprüchliche Angaben. „Stiefkinder und Pflegekinder nicht automatisch Pflicht-Erben“ ist durch keine zitierte Quelle belegt (Fiqh-Schluss). |
| `testament-erbe.ts` `erbe-wasiyyah` | „für Nicht-Pflicht-Erben“; „Mehr als ein Drittel erfordert … Zustimmung der Erben“ | `hadith-wasiyyah-third`, 4:11 | Beides steht nicht in Bukhari 2742 bzw. Muslim 1628a. Das Verbot des Vermächtnisses an Erben und die Zustimmungsregel sind Fiqh bzw. andere Überlieferungen (nicht zitiert, hier nicht verifiziert). Als Fiqh kennzeichnen oder Beleg ergänzen. |
| `testament-erbe.ts` `erbe-deutschland` | Deutsches Erbrecht, notarielles Testament, Pflichtteil | `official-vorsorgevollmacht` | Falsche Quelle (Vorsorgevollmacht ≠ Erbrecht), außerdem URL 404. |
| `barzakh.ts` `barzakh-what` | „In dieser Zeit enden die weltlichen Taten — außer denen, die fortwirken“ | nur `quran-barzakh` (→ 23:99–100) | Die Ausnahme stammt aus Muslim 1631, nicht aus 23:99–100. Die arabische Schreibung „بارزخ“ ist falsch, korrekt: „برزخ“. |
| `barzakh.ts` `barzakh-sadaqa` / `sadaqa-jariya.ts` `sj-what`, `sj-examples` | Brunnen, Schulen, Moscheen, Medizin als Sadaqa Jariya | `hadith-sadaqa-jariya` | Beispiele stehen nicht im Hadith (Muslim 1631 nennt nur „fortlaufende Sadaqa“). Als allgemeine Erläuterung vertretbar, aber nicht als Hadith-Inhalt darstellen. |
| `janazah.ts` `janazah-hasten` | „Kulturelle Wartezeiten (7., 40., 52. Tag) sind nicht islamisch vorgeschrieben“ | `hadith-janazah-hasten` | Gedenktage nach der Beerdigung haben mit der Beschleunigung der Bestattung nichts zu tun. Der Hadith trägt diese Aussage nicht. |
| `kulturfilter.ts` `kultur-7-40-52` | „nicht aus Quran oder authentischen Hadithen als Pflicht belegt“ | `hadith-janazah-hasten` | Quelle belegt das nicht. Eine Negativaussage braucht eine Gelehrtenquelle oder keine Primärquelle. |
| `kulturfilter.ts` `kultur-traueressen` | Taʿziya empfohlen, keine Pflichtfeiern | `hadith-sadaqa-jariya` | Muslim 1631 hat keinen Bezug zu Traueressen oder Taʿziya. |
| `kulturfilter.ts` `kultur-quran-geld` | Bezahlte Qur'an-Lesungen umstritten | `hadith-sadaqa-jariya` | Kein Bezug. |
| `kulturfilter.ts` `kultur-lautes-klagen` | „Der Prophet ﷺ hat vor übertriebener Trauer … gewarnt“ | `fiqh-janazah-basics` | Prophetenaussage ohne Hadithbeleg. Braucht eine konkrete, verifizierte Hadithreferenz (hier nicht ermittelt). |
| `kulturfilter.ts` `kultur-familie-belasten` | Keine Schulden hinterlassen, isrāf verboten | `hadith-janazah-hasten` | Falsche Quelle. Passend wäre `hadith-debts-deceased` für Schulden; für isrāf fehlt ein Beleg. |
| `kulturfilter.ts` `kultur-ueberfuehrung` | Überführung keine Pflicht, zeitnahe Beisetzung | `hadith-janazah-hasten` | Teilweise gedeckt (Eile). „keine religiöse Pflicht“ ist Fiqh. |
| `wissen-topics.ts` `w-sadaqa` | Sadaqa Jariya „in der authentischen Überlieferung genannt“ | + `quran-al-muminun-23-99` | 23:99–100 erwähnt Sadaqa Jariya nicht. Höchstens lose thematisch („rechtschaffen handeln in dem, was ich hinterlassen habe“). |
| `wissen-topics.ts` `w-pv` | „Rechtsgrundlage: § 1901a BGB“ | – | Seit der Betreuungsrechtsreform (1.1.2023) steht die Patientenverfügung in **§ 1827 BGB**. Hinweis aus Fachwissen, Gesetzestext hier nicht abgerufen. |
| `wissen-topics.ts` `w-betreuung` | „Betreuungsverfügung nach § 1896 BGB“ | – | Seit 1.1.2023 §§ 1814 ff., 1816 BGB (wie oben, nicht abgerufen). |
| `wissen-topics.ts` `w-vollmacht` | „§ 1358 BGB: … nur in bestimmten Alltagsangelegenheiten“ | – | § 1358 BGB regelt die Notvertretung in **Gesundheitsangelegenheiten** (befristet). „Alltagsangelegenheiten“ ist irreführend (Fachwissen, nicht abgerufen). |
| `docs/content-source-audit.md` | alle Einträge „korrekt: ja“ | – | Durch diese Prüfung widerlegt für 4:11, 4:12, 4:176, Bukhari 1254, 1273, 2738 und die drei offiziellen URLs. |

Unkritisch: `src/lib/inheritance/rulesets.ts`/`calculate.ts` zitieren 4:11/4:12 korrekt als Grundlage und sind als `unreviewed_draft` gesperrt. Der angezeigte 4:11-Text widerspricht aber der Rechenlogik (2:1). `akhira-section.tsx` zeigt `hadith-sadaqa-jariya` (korrekt).

---

## 5. Zusammenfassung

| Klasse | Anzahl | Records |
|---|---|---|
| KORREKT | 4 | `hadith-janazah-hasten`, `hadith-sadaqa-jariya`, `hadith-wasiyyah-third`, `partner-gemeinsam1-sadaqa` |
| KORREKTUR NÖTIG | 16 | alle 7 Qur'an-Records; Hadith `-1254`, `-1273`, `-wasiyyah-saad`, `-debts-deceased`; `fiqh-ghusl-kafan`, `fiqh-janazah-basics`; 3 × `official-*` |
| NICHT VERIFIZIERBAR | 0 Records (Teilaspekte: Lizenz der Bubenheim-Übersetzung; sunnah.com direkt wegen HTTP 403 nicht abrufbar, Gegenprüfung über hadith-api und ihadis.com) |

**Schwerste Probleme**
1. **Qur'an 4:11 inhaltlich falsch**: Der angezeigte Text sagt, Söhne und Töchter erben gleich viel. Der Vers sagt: Ein Sohn erhält so viel wie zwei Töchter. Er wird als lizenzierte Bubenheim/Elyas-Übersetzung ausgewiesen.
2. **Keiner der 7 Qur'an-Texte ist wörtlich Bubenheim/Elyas**, trotzdem `isParaphrase: false` und die Attribution „Keine inhaltliche Umformulierung“. 4:12 und 4:176 sind ohne Kennzeichnung gekürzt.
3. **3 von 7 Hadith-Nummern zeigen auf andere Hadithe**: Bukhari 1254 (Ghusl statt Qirat → 1325), Bukhari 1273 (Kafan statt Gräberbesuch → Muslim 977a / Tirmidhi 1054), Bukhari 2738 (Testament schreiben statt Saʿd → 2742/2744/1295).
4. **Alle 3 offiziellen Behörden-URLs liefern 404.** Für zwei gibt es geprüfte erreichbare BMJ-Alternativen.
5. Mehrere Kulturfilter- und Artikelaussagen zitieren Quellen ohne inhaltlichen Bezug (v. a. `hadith-janazah-hasten` und `hadith-sadaqa-jariya` als Sammelbeleg).

Testläufe: keine (`NOT_RUN`), reine Inhaltsprüfung.
