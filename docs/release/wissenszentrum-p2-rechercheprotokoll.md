# P23 – Quellenprüfung Wissenszentrum (Stand 2026-11-18)

Nur öffentliche Webrecherche, lesend. Keine Konten, Formulare oder kostenpflichtigen Inhalte.
Status-Kennzeichnung: **direkt gelesen** (Seite/API selbst abgerufen) · **Suchauszug** (nur Websuche-Snippet bzw. zusammengefasster Suchtreffer, Originalseite nicht abrufbar) · **nicht abrufbar**.

---

## 1. QuranEnc – german_bubenheim (Bubenheim & Elyas)

**Abrufweg:** Die HTML-Seite `https://quranenc.com/de/browse/german_bubenheim/2` lädt Verse per Teilansicht (WebFetch sah nur 2:1–2:5). Per-Vers-Seiten (`https://quranenc.com/de/browse/german_bubenheim/{Sure}/{Vers}`) liefern HTTP 200; für 2:180 wurde der Text im HTML direkt gefunden und ist identisch mit der API. Alle Texte unten stammen aus der offiziellen, öffentlichen QuranEnc-API (in der Footer-/API-Dokumentation der Site beschrieben):
`https://quranenc.com/api/v1/translation/aya/german_bubenheim/{Sure}/{Vers}` – **direkt gelesen**.

**Version:**
- Startseite `https://quranenc.com/de/home` zeigt: „03/11/2026 - V1.1.5 – Die deutsche Übersetzung - Frank Bubenheim. – Übersetzt von Abdullah As-Samit (Frank Bubenheim) und Dr. Nadim Elias.“ – **direkt gelesen**
- API `https://quranenc.com/api/v1/translations/list/de`: `"key": "german_bubenheim"`, `"version": "1.1.5"`, `"last_update": 1793715604` (= 2026-11-03 14:20 UTC), `"title": "German Translation - Frank Bubenheim"`, `"description": "Translated by 'Abdullah as-Sāmit (Frank Bubenheim) and Dr. Nadim Elias."` – **direkt gelesen**
- Auf den Vers-Seiten selbst wird keine Versionsnummer angezeigt (nur Link „Browse Old Version“).
- Hinweis: Die Version ändert sich laufend (zuletzt 03.11.2026). Die im Auftrag genannte „1.1.4“ ist **veraltet**.

**Fußnoten:** Für alle neun Verse liefert die API `"footnotes": null` – keine Fußnoten/Fußnotenmarker.

| Vers | URL | Text (verbatim, API v1.1.5) | Status |
|---|---|---|---|
| 2:156 | https://quranenc.com/de/browse/german_bubenheim/2/156 | die, wenn sie ein Unglück trifft, sagen: „Wir gehören Allah, und zu Ihm kehren wir zurück. | direkt gelesen (API) |
| 2:180 | https://quranenc.com/de/browse/german_bubenheim/2/180 | Vorgeschrieben ist euch, wenn sich einem von euch der Tod naht, sofern er Gut hinterläßt, ein Vermächtnis zugunsten der Eltern und nächsten Verwandten in rechtlicher Weise zu treffen, als eine Pflicht für die Gottesfürchtigen. | direkt gelesen (API + HTML-Seite identisch) |
| 2:181 | https://quranenc.com/de/browse/german_bubenheim/2/181 | Wer es aber abändert - nachdem er es gehört hat-, so liegt dessen Sünde nur bei demjenigen, der es abändert. Allah ist Allhörend und Allwissend. | direkt gelesen (API) |
| 2:182 | https://quranenc.com/de/browse/german_bubenheim/2/182 | Wer aber von Seiten eines Erblassers Abweichung oder Sünde befürchtet und zwischen ihnen schlichtet, den trifft keine Sünde. Allah ist Allvergebend und Barmherzig. | direkt gelesen (API) |
| 2:282 | https://quranenc.com/de/browse/german_bubenheim/2/282 | O die ihr glaubt, wenn ihr auf eine festgesetzte Frist, einer vom anderen, eine Geldschuld aufnehmt, dann schreibt es auf. Und ein Schreiber soll (es) für euch gerecht aufschreiben. Und kein Schreiber soll sich weigern zu schreiben, so wie Allah (es) ihn gelehrt hat. So soll er denn schreiben, und diktieren soll der Schuldner, und er soll Allah, seinen Herrn, fürchten und nichts davon schmälern. Wenn aber der Schuldner töricht oder schwach ist oder unfähig, selbst zu diktieren, so soll sein Sachwalter (es) gerecht diktieren. Und bringt zwei Männer von euch als Zeugen. Wenn es keine zwei Männer sein (können), dann sollen es ein Mann und zwei Frauen sein, mit denen als Zeugen ihr zufrieden seid, - damit, wenn eine von beiden sich irrt, eine die andere erinnere. Und die Zeugen sollen sich nicht weigern, wenn sie aufgefordert werden. Und seid nicht abgeneigt, es - (seien es) klein(e) oder groß(e Beträge) - mit seiner (vereinbarten) Frist aufzuschreiben! Das ist gerechter vor Allah und richtiger für das Zeugnis und eher geeignet, daß ihr nicht zweifelt; es sei denn, es ist ein sofortiger Handel, den ihr unter euch tätigt. Dann ist es keine Sünde für euch, wenn ihr es nicht aufschreibt. Und nehmt Zeugen, wenn ihr untereinander einen Verkauf abschließt. Und kein Schreiber oder Zeuge soll zu Schaden kommen. Wenn ihr (es) aber (dennoch) tut, so ist es ein Frevel von euch. Und fürchtet Allah! Und Allah lehrt euch. Allah weiß über alles Bescheid. | direkt gelesen (API) |
| 3:185 | https://quranenc.com/de/browse/german_bubenheim/3/185 | Jede Seele wird den Tod kosten. Und erst am Tag der Auferstehung wird euch euer Lohn in vollem Maß zukommen. Wer dann dem (Höllen)feuer entrückt und in den (Paradies)garten eingelassen wird, der hat fürwahr einen Erfolg erzielt. Und das diesseitige Leben ist nur trügerischer Genuß. | direkt gelesen (API) |
| 4:11 | https://quranenc.com/de/browse/german_bubenheim/4/11 | Allah empfiehlt euch hinsichtlich eurer Kinder: Einem männlichen Geschlechts kommt ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts. Wenn es aber (ausschließlich) Frauen sind, mehr als zwei, dann stehen ihnen zwei Drittel dessen zu, was er hinterläßt; wenn es (nur) eine ist, dann die Hälfte. Und den Eltern steht jedem ein Sechstel von dem zu, was er hinterläßt, wenn er Kinder hat. Wenn er jedoch keine Kinder hat und seine Eltern ihn beerben, dann steht seiner Mutter ein Drittel zu. Wenn er Brüder hat, dann steht seiner Mutter (in diesem Fall) ein Sechstel zu. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das er festgesetzt hat, oder einer Schuld. Eure Väter und eure Söhne - ihr wißt nicht, wer von ihnen euch an Nutzen näher steht. (Das alles gilt für euch) als Verpflichtung von Allah. Gewiß, Allah ist Allwissend und Allweise. | direkt gelesen (API) |
| 4:12 | https://quranenc.com/de/browse/german_bubenheim/4/12 | Und euch steht die Hälfte vom dem zu, was eure Gattinnen hinterlassen, wenn sie keine Kinder haben. Wenn sie jedoch Kinder haben, dann steht euch ein Viertel von dem zu, was sie hinterlassen. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das sie festgesetzt haben, oder einer Schuld. Und ihnen steht ein Viertel von dem zu, was ihr hinterlaßt, wenn ihr keine Kinder habt. Wenn ihr jedoch Kinder habt, dann steht ihnen ein Achtel von dem zu, was ihr hinterlaßt. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das ihr festgesetzt habt, oder einer Schuld. Und wenn ein Mann oder eine Frau ohne Eltern oder Kinder beerbt wird und er (bzw. sie) einen (Halb)bruder oder eine (Halb)schwester (mütterlicherseits) hat, dann steht jedem von beiden ein Sechstel zu. Wenn es jedoch mehr als dies sind, dann sollen sie Teilhaber an einem Drittel sein. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das festgesetzt worden ist, oder einer Schuld, ohne Schädigung. (Das alles ist euch) anbefohlen von Allah. Allah ist Allwissend und Nachsichtig. | direkt gelesen (API) |
| 4:176 | https://quranenc.com/de/browse/german_bubenheim/4/176 | Sie fragen dich um Belehrung. Sag: Allah belehrt euch über den Erbanteil seitlicher Verwandtschaft. Wenn ein Mann umkommt, der keine Kinder hat, aber eine Schwester, dann steht ihr die Hälfte dessen zu, was er hinterläßt. Und er beerbt sie, wenn sie keine Kinder hat. Und wenn es zwei (Schwestern) sind, stehen ihnen (beiden) zwei Drittel dessen zu, was er hinterläßt. Und wenn es Geschwister sind, Männer und Frauen, dann kommt einem männlichen Geschlechts ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts. Allah gibt euch Klarheit, damit ihr (nicht) in die Irre geht. Allah weiß über alles Bescheid. | direkt gelesen (API) |

**Auffälligkeiten (nicht korrigieren, da Änderungsverbot – siehe Abschnitt 2):**
- 2:156 beginnt klein („die, …“, Relativsatz-Fortsetzung von 2:155) und das öffnende „ hat im Quelltext **kein schließendes** “.
- 2:181: Leerzeichen-Asymmetrie „- nachdem er es gehört hat-,“ ist so im Quelltext.
- 4:12: „die Hälfte **vom dem** zu“ – Tippfehler im Quelltext (verbatim übernommen).
- Alte Rechtschreibung (hinterläßt, daß, Genuß, wißt) ist Teil des Originals.
- Die Formulierung „Sie fragen dich um Belehrung“ (4:176) ist verbatim.

---

## 2. QuranEnc – Nutzungsbedingungen / Lizenz

**QuranEnc „Terms and Policies“** – im Modal jeder Browse-Seite eingebettet, z. B. https://quranenc.com/de/browse/german_bubenheim/2/180 (Modal `#terms_modal`; nur auf Englisch, auch auf der deutschen Seite) – **direkt gelesen**. Wortlaut:

> Contents of the translations can be downloaded and re-published, with the following terms and conditions:
> 1. No modification, addition, or deletion of the content.
> 2. Clearly referring to the publisher and the source (QuranEnc.com).
> 3. Mentioning the version number when re-publishing the translation.
> 4. Keeping the transcript information inside the document.
> 5. Notifying the source (QuranEnc.com) of any note on the translation.
> 6. Updating the translation according to the latest version issued from the source (QuranEnc.com).
> 7. Inappropriate advertisements must not be included when displaying translations of the meanings of the Noble Quran.

Bewertung:
- Weiterveröffentlichung (auch in Apps/Websites) ist nach diesen Bedingungen **erlaubt**; eine gesonderte Genehmigungsanfrage wird **nicht** verlangt. Es gibt keine ausdrückliche Lizenz (z. B. CC); die Bedingungen sind die einzige Erklärung.
- Pflichten für die App: wörtlich, keine Kürzung/Ergänzung im Zitat (Auslassungen eines Teilverses sind streng genommen „deletion“ → am sichersten ganze Verse zitieren oder Auslassung klar kennzeichnen und mit Owner/QuranEnc klären), Angabe von Herausgeber + „QuranEnc.com“ + Versionsnummer (aktuell **V1.1.5, 03.11.2026**), Aktualisierungspflicht bei neuen Versionen, keine unangemessene Werbung.
- „About“-Seite https://quranenc.com/en/home/about – **direkt gelesen**: „EQE is a portal featuring free and trustworthy translations … They are both accessible and shareable on social media.“; Arbeitskriterium: „The output and originals of the EQE project are freely accessible to all Muslims.“; Footer „QuranEnc.com © 2026“. Keine weitergehende Lizenz.

**Herausgeber / King Fahd Complex:**
- QuranEnc nennt für german_bubenheim **keinen** Herausgeber, nur die Übersetzer (siehe Abschnitt 1). „Herausgegeben vom König-Fahd-Zentrum …“ steht auf der QuranEnc-Startseite nur bei *At-Tafsir Al-Muyassar*, nicht bei Bubenheim – **direkt gelesen**.
- Druckausgabe: „Der edle Qur'an und die Übersetzung seiner Bedeutungen in die deutsche Sprache“, Übers. Nadeem Ata Elyas / Abdullah as-Samit Frank Bubenheim, Medina: König-Fahd-Komplex zum Druck des Qur'an, 1422/1423 H. (2002), 624 S.; laut Rezension auf dem Innendeckel als Geschenk „not to be sold“ – Quelle: Rezension Institut für Islamfragen, https://www.islaminstitut.de/en?p=202699 – **direkt gelesen** (Sekundärquelle; kein Copyright-Vermerk dort zitiert).
- King Fahd Complex (qurancomplex.gov.sa): **keine** allgemeine öffentliche Erklärung zu Reproduktionsbedingungen seiner Übersetzungen gefunden. Gefunden nur: freie Nutzung der Rezitations-Audios (https://qurancomplex.gov.sa/en/?p=4973), Font-EULA „All Rights Reserved“ (Drittseite https://openhub.net/licenses/KFGQPC) – **Suchauszug**, nicht direkt gelesen.
- Folgerung: Rechteinhaber der Druckausgabe ist nach öffentlicher Lage vermutlich der König-Fahd-Komplex (nicht belegt durch einen direkt gelesenen Copyright-Vermerk). Die App stützt sich auf die QuranEnc-Bedingungen; optional (empfohlen bei kommerzieller App) schriftliche Bestätigung bei QuranEnc einholen.

Empfohlener Quellenvermerk in der App (Vorschlag):
„Übersetzung der Bedeutungen: Frank Bubenheim & Nadeem Elyas, Quelle: QuranEnc.com (german_bubenheim), Version 1.1.5 (03.11.2026)“ + Link auf die Vers-URL.

---

## 3. sunnah.com

**Zugriff:** sunnah.com liefert für alle Seiten (Hadith-Seiten, Buchseiten, /about, beta.sunnah.com/about) **HTTP 403** sowohl per curl als auch WebFetch → **nicht abrufbar**. Nicht wiederholt. Alle Angaben unten aus Websuche-Treffern (Seitentitel + Snippets) = **Suchauszug**. Für Bukhari wurden Buch-/In-Book-Nummern und englischer Text zusätzlich mit dem offenen Spiegel `cdn.jsdelivr.net/gh/fawazahmed0/hadith-api` (Datenbasis entspricht sunnah.com-Nummerierung) gegengeprüft – Übereinstimmung; das ist eine Sekundärquelle, kein sunnah.com-Beleg.

Grad: Für Bukhari/Muslim zeigt sunnah.com üblicherweise keinen Einzelgrad (Sammlung gilt als sahih); in den Suchauszügen **kein Grad sichtbar**.

| Referenz | URL | Buch (Seitentitel) | In-Book-Ref. | Inhalt (sinngemäß, nicht als Zitat verwenden) | Status |
|---|---|---|---|---|---|
| Sahih Muslim 939a | https://sunnah.com/muslim:939a | „The Book of Prayer - Funerals - كتاب الجنائز“ | Book 11, Hadith 46 (USC-MSA: Book 4, Hadith 2041, veraltet) | Umm ʿAtiyya: Der Prophet kam, als sie seine Tochter wuschen; er ordnete Waschung mit Wasser und Lotusblättern drei- oder fünfmal oder öfter an, mit Kampfer zuletzt, und gab danach sein Untergewand als Leichentuch. (Die Formulierung „ungerade Anzahl“ steht in 939e/939g, nicht in 939a.) | Suchauszug |
| Sahih Muslim 1628a | https://sunnah.com/muslim:1628a | „The Book of Wills - كتاب الوصية“ | Book 25, Hadith 6 | Saʿd b. Abi Waqqas, krank (Abschiedswallfahrt), mit nur einer Tochter als Erbin, fragt nach Vermächtnis von zwei Dritteln/der Hälfte; erlaubt wird ein Drittel („ein Drittel, und ein Drittel ist viel“); Erben wohlhabend zu hinterlassen ist besser. | Suchauszug |
| Sahih Muslim 1631 | https://sunnah.com/muslim:1631 | „The Book of Wills - كتاب الوصية“ | Book 25, Hadith 20 (USC-MSA: Book 13, Hadith 4005) | Mit dem Tod enden die Taten eines Menschen außer drei: fortlaufende Spende (sadaqa jariya), nutzbringendes Wissen, rechtschaffenes Kind, das für ihn bittet. | Suchauszug |
| Sahih al-Bukhari 1254 | https://sunnah.com/bukhari:1254 | „Funerals (Al-Janaa'iz) - كتاب الجنائز“ | Book 23, Hadith 16 | Umm ʿAtiyya: Waschung der verstorbenen Prophetentochter drei-, fünfmal oder öfter mit Wasser und Sidr, Kampfer am Ende; Leichentuch aus seinem Hüfttuch; Kapitel zum Waschen in ungerader Zahl. | Suchauszug + Spiegel |
| Sahih al-Bukhari 1273 | https://sunnah.com/bukhari:1273 | „Funerals (Al-Janaa'iz) - كتاب الجنائز“ | Book 23, Hadith 34 | ʿAisha: Der Prophet wurde in drei weiße Tücher (Suhul) gehüllt, ohne Hemd und Turban. | Suchauszug + Spiegel |
| Sahih al-Bukhari 1315 | https://sunnah.com/bukhari:1315 | „Funerals (Al-Janaa'iz) - كتاب الجنائز“; Kapitel „Hurrying up with the coffin“ | Book 23, Hadith 72 | Abu Huraira: Eilt mit dem Verstorbenen – war er rechtschaffen, bringt ihr ihn zum Guten, sonst legt ihr eine Last von euren Schultern. | Suchauszug + Spiegel |
| Sahih al-Bukhari 2738 | https://sunnah.com/bukhari:2738 | „Wills and Testaments (Wasaayaa) - كتاب الوصايا“ | Book 55, Hadith 1 | Ibn ʿUmar: Ein Muslim, der etwas zu vermachen hat, soll keine zwei Nächte verbringen, ohne dass sein Testament schriftlich bei ihm bereitliegt. | Suchauszug + Spiegel |
| Sahih al-Bukhari 2742 | https://sunnah.com/bukhari:2742 | „Wills and Testaments (Wasaayaa) - كتاب الوصايا“ | Book 55, Hadith 5 | Saʿd b. Abi Waqqas (Mekka, krank): nicht alles, nicht die Hälfte, aber ein Drittel – „und ein Drittel ist viel“; Erben reich zu hinterlassen ist besser als arm und bettelnd. | Suchauszug + Spiegel |
| Sahih al-Bukhari 2744 | https://sunnah.com/bukhari:2744 | „Wills and Testaments (Wasaayaa) - كتاب الوصايا“ | Book 55, Hadith 7 | Saʿd: will bei nur einer Tochter die Hälfte vermachen; der Prophet lässt ein Drittel zu („ein Drittel ist viel“); danach vermachten die Leute ein Drittel, und es war ihnen erlaubt. | Suchauszug + Spiegel |

**Buchseiten (Kitab al-Jana'iz):**

| Sammlung | URL | Titel (laut Suchtreffer-Seitentitel) | Status |
|---|---|---|---|
| Sahih al-Bukhari, Buch 23 | https://sunnah.com/bukhari/23 | „Funerals (Al-Janaa'iz)“ (arab. كتاب الجنائز) | Suchauszug |
| Sahih Muslim, Buch 11 | https://sunnah.com/muslim/11 | „The Book of Prayer - Funerals“ (arab. كتاب الجنائز) | Suchauszug |
| (ergänzend) Bukhari, Buch 55 | https://sunnah.com/bukhari/55 | „Wills and Testaments (Wasaayaa)“ | Suchauszug |
| (ergänzend) Muslim, Buch 25 | https://sunnah.com/muslim/25 | „The Book of Wills“ | Suchauszug |

**sunnah.com – Nutzungsbedingungen:** https://sunnah.com/about – **nicht abrufbar (403)**; Inhalt nur als **Suchauszug**: Abschnitt „Reproduction, Copying, Scraping“ mit dem Satz
> „We do not permit the scraping of our data, nor mass reproduction of entire books or collections on other websites.“

Weitere Hinweise (Suchauszug): Die englischen Übersetzungen stammen von verschiedenen Übersetzern (laut Drittquelle überwiegend Darussalam); die API (github.com/sunnah-com/api) ist schlüsselpflichtig, Zugriffe werden per GitHub-Issue beantragt – keine öffentliche Freigabe für Weiterverwendung gefunden.

Bewertung: Einzelne Hadithe mit Referenz + Link sind nach dem Wortlaut nicht ausdrücklich verboten, aber auch nicht ausdrücklich erlaubt; die englischen Übersetzungstexte sind vermutlich urheberrechtlich geschützt (Übersetzer/Verlag). **Empfehlung:** in der App nur Referenz (z. B. „Sahih al-Bukhari 2738“) + eigene, als solche gekennzeichnete sinngemäße Zusammenfassung + Link; keine wörtlichen englischen/deutschen Übersetzungen als Zitat ohne Genehmigung. Vor Veröffentlichung jede Hadith-Seite manuell im Browser gegenprüfen (hier wegen 403 nicht möglich).

---

## 4. Tafsir Ibn Kathir

**(a) Arabische Standardausgabe**
- *Tafsīr al-Qurʾān al-ʿAẓīm*, Ibn Kathīr (gest. 774 H.), Ausgabe **Dār Ṭayba li-n-Našr wa-t-Tawzīʿ, Riad, taḥqīq Sāmī b. Muḥammad as-Salāma** – Verlag und Herausgeber bestätigt durch Forum alukah (https://majles.alukah.net/showthread.php?p=935448&t=183252) und quranpedia-Indexseiten (z. B. https://quranpedia.net/ayahs/17/63/1/136) – **Suchauszug**.
- Erscheinungsjahr „2. Aufl. 1420 H./1999, 8 Bände“: **nicht durch eine abgerufene Quelle bestätigt** (nur allgemein bekannt; Katalogprüfung WorldCat/KFNL nötig).
- Alternative kritische Edition: Muʾassasat Qurṭuba / Maktabat Awlād aš-Šayḫ, Gizeh 2000, 15 Bde. (Hg. Muṣṭafā as-Sayyid Muḥammad u. a.) – Textgrundlage der deutschen IB-Verlag-Ausgabe, laut deren Vorwort (Leseprobe, s. u.) – **direkt gelesen**.

**(b) Deutsche Übersetzung**
- **IB-Verlag – Islamische Bibliothek, Düsseldorf**; Übersetzung/Zusammenfassung **Dawud Mitterhuber**; gekürzte Ausgabe (Kürzung von Isnaden, Wiederholungen, sehr schwachen/erfundenen Überlieferungen).
  - Bd. „Sure 50 bis 114“ (= *Muḫtaṣar tafsīr Ibn Kaṯīr*), Gekürzte Ausgabe, 1. Aufl., 1437 H./Januar 2016, 753 S., ISBN 978-3-941111-48-6 – Deutsche Digitale Bibliothek https://www.deutsche-digitale-bibliothek.de/item/KKTA7HIM5JUDRTAN5CNZ2KHXHCWU3JKC – **direkt gelesen**.
  - Bd. „Sure 3 und Sure 4“, Vorwort Herausgeber Mohammed Amine Ramdani, Düsseldorf, Januar 2024; Leseprobe https://muslim-buch.de/mediafiles/Sonstiges/Sure_3_bis_4_Leseprobe.pdf – **direkt gelesen** (Impressum/Copyright-Seite in der Leseprobe nicht enthalten). Das Vorwort nennt als Grund, keine bestehende arabische Kurzfassung zu übersetzen: „Der Hauptgrund ist das Urheberrecht.“
- Kommerzielles Verlagswerk; **keine freie Lizenz gefunden**. Keine andere vollständige deutsche Übersetzung gefunden (englisch: Darussalam, 10 Bde., kommerziell).

**(c) Frei zugängliche arabische Online-Quellen**

| Quelle | URL | Ausgabe angegeben? | Nutzungsbedingungen | Status |
|---|---|---|---|---|
| King Saud University – Elektronisches Mushaf | https://quran.ksu.edu.sa/tafseer/katheer/sura2-aya180.html | nein | keine Lizenz-/Copyright-Angabe auf der Seite sichtbar | direkt gelesen |
| tafsir.app („الباحث القرآني“) | https://tafsir.app/ibn-katheer/2/180 | „نحو ١٩ مجلدًا“; Fußnoten im Taḥqīq-Stil (vermutlich Dār-Ṭayba-Edition, nicht belegt) | keine Lizenzangabe im abrufbaren HTML gefunden („حول المصدر“ nur per JS) | direkt gelesen |
| QuranEnc | – | – | QuranEnc führt **keinen** Ibn-Kathir-Tafsir (arab. Liste: Muyassar, Mukhtasar, Siraj u. a.) | direkt gelesen |

**Schlussfolgerung Tafsir Ibn Kathir:**
- Der arabische Grundtext (14. Jh.) ist gemeinfrei; Editionsleistungen (Taḥqīq, Fußnoten, Satz) können aber geschützt sein.
- Jeder **deutsche** Ibn-Kathir-Text ist entweder ein geschütztes Verlagswerk (IB-Verlag/Mitterhuber) oder eine eigene Übersetzung – Letztere wäre eine Paraphrase, die nicht als Zitat dargestellt werden darf.
- **Wörtliches Zitieren deutscher Ibn-Kathir-Passagen in der App erfordert eine Genehmigung des Verlags.**
- **Empfehlung: nur Referenz** – „Tafsir Ibn Kathir zu Sure X, Vers Y“ (optional Ausgabe Dār Ṭayba, Band/Seite, nach Prüfung am Druckexemplar), ohne deutschen Zitattext.

---

## Gesperrte/nicht abrufbare Quellen
- sunnah.com (alle Seiten inkl. /about, beta.sunnah.com/about): HTTP 403 – nicht wiederholt.
- qurancomplex.gov.sa: nicht direkt abgerufen; nur Suchauszüge.
- muslim-buch.de Leseprobe: abrufbar, aber ohne Impressum.
