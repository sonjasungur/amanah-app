# Lizenzstatus und wörtliche Texte – Wissensbereich „Mein Wille/Amanah“

Prüfdatum: 2026-10-30 (Abrufe 12:18–12:30 UTC). Nur lesend, keine Datei im Repo `amanah-app` geändert.
Grundlage: `wissen-quellenpruefung.md` (Vorprüfung), `src/lib/knowledge/quran-verses.ts`, `src/lib/knowledge/sources.ts`.
Begleitdatei mit den Verstexten: `/tmp/claude-1000/-mnt-daten-03-MSC-Engineering-01-Aktive-Projekte-Projects-amanah-app/c6db0b57-992d-48b0-8932-9e9ebd224b8c/scratchpad/quran-verbatim.json`
Rohdaten der Abrufe: `.../scratchpad/dl/` (qe = QuranEnc, tz = Tanzil, ha = hadith-api, web/gh = Seiten).

Wichtig: Dies ist eine Recherche, **keine Rechtsberatung**. Wo die Rechtekette nicht belegbar ist, steht das ausdrücklich dabei.

---

## Teil 1 – Lizenzstatus

### 1a) Bubenheim & Elyas über QuranEnc.com

| Punkt | Befund | Quelle |
|---|---|---|
| Übersetzung bei QuranEnc | Schlüssel `german_bubenheim`, Titel „German Translation - Frank Bubenheim“, Beschreibung „Translated by ‘Abdullah as-Sāmit (Frank Bubenheim) and Dr. Nadim Elias.“ | `https://quranenc.com/api/v1/translations/list/de` (curl, 2026-10-30) |
| Version | **`1.1.4`**, `last_update` 1738581834 (= 2025-02-03 11:23:54 UTC). Der Aya-Endpunkt liefert **kein** `version`-Feld, nur die Liste. | wie oben |
| Nutzungsbedingungen | Abschnitt „Terms and Policies“ (im Fußbereich jeder Seite, wortgleich auf About-, API- und Browse-Seite). Eigene Terms-URL existiert nicht (`/en/home/terms`, `/en/terms` → HTTP 404). | `https://quranenc.com/en/home/about`, `https://quranenc.com/en/home/api` (HTTP 200) |

Wortlaut der QuranEnc-Bedingungen (abgerufen 2026-10-30, `https://quranenc.com/en/home/about`):

> Contents of the translations can be downloaded and re-published, with the following terms and conditions:
> 1. No modification, addition, or deletion of the content.
> 2. Clearly referring to the publisher and the source (QuranEnc.com).
> 3. Mentioning the version number when re-publishing the translation.
> 4. Keeping the transcript information inside the document.
> 5. Notifying the source (QuranEnc.com) of any note on the translation.
> 6. Updating the translation according to the latest version issued from the source (QuranEnc.com).
> 7. Inappropriate advertisements must not be included when displaying translations of the meanings of the Noble Quran.

Ergänzend aus „About“: „Creating a free electronic reference … to replace the unreliable references currently available on the Internet“ und „The output and originals of the EQE project are freely accessible to all Muslims.“

**Bewertung**
- Die Bedingungen erlauben das Wiederveröffentlichen ausdrücklich. Ein Verbot kommerzieller Betreiber steht **nicht** darin. Die Wissensseiten sind werbefrei und kostenlos, Bedingung 7 ist damit erfüllt.
- Pflichten für die App: (1) Wortlaut exakt, keine Kürzung oder Ergänzung im Übersetzungsfeld; Erläuterungen getrennt als Anmerkung. **Teilzitate (z. B. nur halber Vers 4:12) sind nach Bedingung 1 riskant. Empfehlung: immer vollständige Verse.** (2) Herausgeber und Quelle nennen, z. B. „Übersetzung: ʿAbdullah as-Sāmit Frank Bubenheim und Dr. Nadeem Elyas, Quelle: QuranEnc.com (german_bubenheim, Version 1.1.4)“. (3) Versionsnummer anzeigen. (6) Updates nachziehen: Version regelmäßig über `/api/v1/translations/list/de` prüfen. (5) Fehlermeldungen an QuranEnc richten.
- Bedingung 4 („transcript information“) ist unklar formuliert. Gemeint sind vermutlich die Kopfangaben einer Download-Datei. Ein Aufbewahren der Metadaten (Titel, Beschreibung, Version) im Repo deckt das ab. Das ist eine Auslegung.
- **Rechtekette NICHT VERIFIZIERBAR:** Die gedruckte Übersetzung erschien beim König-Fahd-Komplex (Medina). Laut Websuche trägt eine PDF-Ausgabe den Vermerk „Copyright © 2000 by Islamisches Zentrum Aachen“ (nur Suchtreffer, Datei nicht geöffnet). Ob QuranEnc im Namen dieser Rechteinhaber Lizenzen erteilt, ist online nicht belegt. Die KFGQPC-Copyright-Seite aus der Suche (`https://dm.qurancomplex.gov.sa/en/?p=138`) lieferte HTTP 404. Bubenheim lebt (keine gegenteilige Quelle gefunden), die Übersetzung ist also urheberrechtlich geschützt. Eine schriftliche Bestätigung von QuranEnc oder KFGQPC wäre die sichere Lösung. Die Anfrage muss der Owner stellen, ich habe niemanden kontaktiert.
- Hinweis: Tanzil führt Bubenheim & Elyas ebenfalls, aber mit **„for non-commercial purposes only“** (siehe 1c). Für einen kommerziellen Betreiber ist QuranEnc deshalb die passendere Quelle.
- Weitere Option mit denselben QuranEnc-Bedingungen: `german_rwwad` (Rowwad Translation Center), Version 1.0.15. Inhaltlich nicht geprüft.

Kleinigkeit: Der QuranEnc-Text nutzt die alte Rechtschreibung („hinterläßt“, „Gewiß“) und hat in 4:12 den Tippfehler „vom dem“. Nach Bedingung 1 nicht selbst korrigieren, sondern nach Bedingung 5 an QuranEnc melden.

### 1b) Alternativen (Deutschland: Schutz bis 70 Jahre nach Tod des Urhebers, § 64 UrhG; Bearbeitungen haben eigenen Schutz, § 3 UrhG)

| Übersetzung | Lebensdaten / Status | Urheberrecht DE | Verlässliche digitale Quelle | Bewertung |
|---|---|---|---|---|
| Bubenheim & Elyas | Übersetzer leben (kein Todesnachweis gefunden) | geschützt | QuranEnc API v1.1.4 mit veröffentlichten Bedingungen | **beste Option** (siehe 1a) |
| Abu Rida Muhammad ibn Ahmad ibn Rassoul | 1929–2015 laut gloqur.de (nur eine Quelle) | geschützt bis 31.12.2085 | Tanzil (`de.aburida`), dort aber nur nicht-kommerziell; QuranEnc führt ihn nicht (Liste `de` enthält nur bubenheim und rwwad) | keine passende Lizenz gefunden |
| Amir Zaidan | Lebensdaten nicht geprüft | geschützt (in jedem Fall, Werk aus den 2000ern) | Tanzil (`de.zaidan`), nur nicht-kommerziell | keine passende Lizenz gefunden |
| Adel Theodor Khoury | † 14.07.2023 (Nachruf Uni Münster: `https://www.uni-muenster.de/ZIT/Aktuelles/2023/Nachruf_Adel_Theodor_Khoury.html`, nur Suchtreffer) | geschützt bis 31.12.2093; Gütersloher Verlagshaus | Tanzil (`de.khoury`), nur nicht-kommerziell | Verlagslizenz nötig |
| Hartmut Bobzin | lebt (kein Todesnachweis gefunden) | geschützt; C.H. Beck 2010 | keine freie digitale Quelle bekannt | Verlagslizenz nötig |
| Rudi Paret | 1901–1983 (Fachwissen, nicht abgerufen) | geschützt bis 31.12.2053; Kohlhammer | keine freie Quelle | Verlagslizenz nötig |
| Max Henning | 1861–09/1927 (Suchtreffer dewiki/gloqur.de) | **Originalausgabe Reclam Leipzig 1901 gemeinfrei** (seit 1.1.1998). **Bearbeitungen geschützt:** Schimmel (Reclam Stuttgart 1960, Einleitung/Anmerkungen/Änderungen), DDR-Ausgabe mit Bearbeitung durch Rudolph, Murad Hofmann (Diederichs/Hugendubel, starke Überarbeitung) | Digitalisat der Ausgabe 1901 mit „Public Domain Mark 1.0“ bei ULB Sachsen-Anhalt (`http://dx.doi.org/10.25673/97993`, laut Suchtreffer DDB) und Scan `https://archive.org/details/derkoran00henn`. Projekt Gutenberg-DE nennt als Vorlage „Reclam jun. 1970“ (also eine spätere Ausgabe, ggf. bearbeitet) und hat eigene Nutzungsbedingungen → **nicht verwenden**. | rechtlich frei nur aus dem 1901-Scan, aber: Fraktur, eigene Transkription nötig, alte Flügel-Verszählung (Abweichung von der Kufa-Zählung muss je Vers geprüft werden), sprachlich veraltet und unter Muslimen wenig akzeptiert. **Nicht empfohlen.** |

### 1c) Arabischer Qur'antext

**Tanzil** (Text heruntergeladen 2026-10-30T12:19:00Z, „Tanzil Quran Text (Uthmani, Version 1.1)“). Lizenzblock in der Datei und auf `https://tanzil.net/docs/text_license`:

> Tanzil Quran Text
> Copyright (C) 2007-2021 Tanzil Project
> License: Creative Commons Attribution 3.0
> …
> TERMS OF USE:
> - Permission is granted to copy and distribute verbatim copies of this text, but CHANGING IT IS NOT ALLOWED.
> - This Quran text can be used in any website or application, provided that its source (Tanzil Project) is clearly indicated, and a link is made to tanzil.net to enable users to keep track of changes.
> - This copyright notice shall be included in all verbatim copies of the text, and shall be reproduced appropriately in all files derived from or containing substantial portion of this text.

(Die heruntergeladene Datei trägt „Copyright (C) 2007-2026“, sonst gleich.)
Pflichten: Text unverändert, Quelle „Tanzil Project“ plus Link auf tanzil.net, Copyright-Block in die Datei im Repo übernehmen. Kommerzielle Nutzung ist nicht ausgeschlossen.

**Tanzil-Übersetzungen** (`https://tanzil.net/trans/`): „The translations provided at this page are for non-commercial purposes only. If used otherwise, you need to obtain necessary permission from the translator or the publisher.“ → Für MSC Engineering GmbH nicht als Quelle für deutsche Übersetzungen nutzen.

**QuranEnc-Arabisch:** Die API liefert `arabic_text` mit (KFGQPC-Hafs-Kodierung, andere Unicode-Zeichen als Tanzil). Eigene Bedingungen für den arabischen Text fand ich bei QuranEnc nicht. Die „Terms and Policies“ sprechen nur von „translations“. → **Empfehlung: Arabisch aus Tanzil (klare Lizenz), Deutsch aus QuranEnc.** Beide Kodierungen nicht mischen.

### 1d) Hadith

| Quelle | Befund | Beleg |
|---|---|---|
| sunnah.com | Seiten (`/about`, `/terms`, `/developers`, `/bukhari:1325`) liefern HTTP 403 (Bot-Sperre). Ein Umgehen der Sperre über Mirror/Archiv wurde vom Sicherheitsfilter abgelehnt und nicht weiter versucht. Laut Websuche hat `/about` einen Abschnitt „Reproduction, Copying, Scraping“. **Der Wortlaut ist NICHT VERIFIZIERT.** Laut Suchzusammenfassung wird Scraping und Massen-Reproduktion abgelehnt. Die GitHub-Repos `sunnah-com/api`, `data` und `website` haben **keine Lizenz** (GitHub-API `license: None`). Offene Anfragen Dritter zu schriftlichen Lizenzbedingungen (Issues #4049 vom 2026-10-08, #4189 vom 2026-10-22, beide ohne Antwort) zeigen: Es gibt keine öffentliche Inhaltslizenz. Die englischen Übersetzungen stammen von verschiedenen Übersetzern und Verlagen (z. B. Muhsin Khan/Darussalam für Bukhari), deren Rechte sunnah.com nicht weitergeben kann. | `https://api.github.com/repos/sunnah-com/api/issues/4049`, `/4189` |
| fawazahmed0/hadith-api | Repo-Lizenz **The Unlicense** (Public Domain Dedication). Die README nennt **keine** Herkunft der Texte und Gradierungen. Die Unlicense gilt nur für das, woran der Repo-Autor Rechte hat. Für fremde englische Übersetzungen (z. B. Muhsin Khan) überträgt sie keine Rechte. Sie eignet sich zum **Prüfen** von Nummern und arabischem Text, nicht als Lizenzgrundlage für englische Übersetzungen. | `https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/LICENSE`, GitHub-API `spdx_id: Unlicense` |
| Arabischer Matn | Die klassischen Werke (Bukhari † 870, Muslim † 875, Tirmidhi † 892) sind gemeinfrei. Moderne Editionen (Vokalisierung, Nummerierung nach Muhammad Fuʾad ʿAbd al-Baqi u. a.) können eigenen Schutz haben (§ 70/§ 71 UrhG bzw. Datenbankrecht). Für kurze Zitate mit Quellenangabe ist das Risiko gering. **Rechtlich nicht abschließend geprüft.** | – |
| Gradierungen | hadith-api liefert bei Tirmidhi 1054: Ahmad Muhammad Shakir „Sahih“, Al-Albani „Sahih“, Bashar Awad Maarouf „Hasan Sahih“, Zubair Ali Zai „Sahih Muslim“. Herkunft im Repo nicht dokumentiert. Auf sunnah.com erscheinen für die Sunan meist „(Darussalam)“ (Gradierungen der englischen Darussalam-Ausgaben, Bearbeiter Hafiz Zubair Ali Zai) und „(Al-Albani)“ (aus seinen Werken Sahih/Daʿif Sunan …). Diese Zuordnung beruht auf Fachwissen und Suchtreffern, nicht auf direkter Prüfung (403). Für Tirmidhi 1054 zeigt die Suchzusammenfassung von sunnah.com „Sahih (Darussalam)“. | hadith-api JSON; WebSearch |
| Bukhari/Muslim | Keine Einzelgradierung nötig. Sie gelten nach allgemeinem Konsens als sahih, sunnah.com zeigt dort in der Regel keine Note. | – |

**Deutsche Hadith-Übersetzungen** – praktikable Optionen:
1. **Eigene Übersetzung** aus dem arabischen Matn durch eine fachlich qualifizierte Person, gekennzeichnet etwa so: „Übersetzung aus dem Arabischen: [Name], fachlich geprüft von [Name/Gremium], Stand [Datum]. Grundlage: arabischer Text nach [Sammlung, Nummer, Edition].“ Die Arbeit erzeugt eigenes Urheberrecht von MSC oder den Übersetzern. Das ist **die sauberste Lösung**.
2. **Sinngemäße Wiedergabe** wie bisher (`isParaphrase: true`). Rechtlich unkritisch, solange sie nicht aus einer geschützten Übersetzung abgeleitet ist. Muss klar als „sinngemäß“ gekennzeichnet bleiben und den Inhalt korrekt treffen (siehe Teil 3).
3. **Lizenz eines deutschen Verlags** für eine gedruckte Übersetzung: nur mit schriftlichem Vertrag. Konkrete Anbieter habe ich nicht geprüft.
4. **Nicht**: englische Texte von sunnah.com oder hadith-api ins Deutsche übertragen. Das wäre eine Bearbeitung eines geschützten Werks.

---

## Teil 2 – Wörtliche Qur'antexte

Vollständig und mit exaktem Unicode in `quran-verbatim.json`. Abrufe:
- Deutsch: `https://quranenc.com/api/v1/translation/aya/german_bubenheim/<sura>/<aya>`, alle HTTP 200, 2026-10-30T12:18:16Z. Version 1.1.4 aus `/api/v1/translations/list/de`. `footnotes` ist bei allen 8 Versen `null`.
- Arabisch: Tanzil Uthmani v1.1, `https://tanzil.net/pub/download/index.php?marks=true&sajdah=true&rub=true&tatweel=true&quranType=uthmani&outType=txt-2&agree=true`, 2026-10-30T12:19:00Z. Zusätzlich ist der QuranEnc-`arabic_text` als `arabicQuranEnc` gespeichert.

Deutsche Texte (exakt wie geliefert):

- **4:11** – Allah empfiehlt euch hinsichtlich eurer Kinder: Einem männlichen Geschlechts kommt ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts. Wenn es aber (ausschließlich) Frauen sind, mehr als zwei, dann stehen ihnen zwei Drittel dessen zu, was er hinterläßt; wenn es (nur) eine ist, dann die Hälfte. Und den Eltern steht jedem ein Sechstel von dem zu, was er hinterläßt, wenn er Kinder hat. Wenn er jedoch keine Kinder hat und seine Eltern ihn beerben, dann steht seiner Mutter ein Drittel zu. Wenn er Brüder hat, dann steht seiner Mutter (in diesem Fall) ein Sechstel zu. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das er festgesetzt hat, oder einer Schuld. Eure Väter und eure Söhne - ihr wißt nicht, wer von ihnen euch an Nutzen näher steht. (Das alles gilt für euch) als Verpflichtung von Allah. Gewiß, Allah ist Allwissend und Allweise.
- **4:12** – Und euch steht die Hälfte vom dem zu, was eure Gattinnen hinterlassen, wenn sie keine Kinder haben. Wenn sie jedoch Kinder haben, dann steht euch ein Viertel von dem zu, was sie hinterlassen. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das sie festgesetzt haben, oder einer Schuld. Und ihnen steht ein Viertel von dem zu, was ihr hinterlaßt, wenn ihr keine Kinder habt. Wenn ihr jedoch Kinder habt, dann steht ihnen ein Achtel von dem zu, was ihr hinterlaßt. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das ihr festgesetzt habt, oder einer Schuld. Und wenn ein Mann oder eine Frau ohne Eltern oder Kinder beerbt wird und er (bzw. sie) einen (Halb)bruder oder eine (Halb)schwester (mütterlicherseits) hat, dann steht jedem von beiden ein Sechstel zu. Wenn es jedoch mehr als dies sind, dann sollen sie Teilhaber an einem Drittel sein. (Das alles) nach (Abzug) eines (etwaigen) Vermächtnisses, das festgesetzt worden ist, oder einer Schuld, ohne Schädigung. (Das alles ist euch) anbefohlen von Allah. Allah ist Allwissend und Nachsichtig.
- **4:176** – Sie fragen dich um Belehrung. Sag: Allah belehrt euch über den Erbanteil seitlicher Verwandtschaft. Wenn ein Mann umkommt, der keine Kinder hat, aber eine Schwester, dann steht ihr die Hälfte dessen zu, was er hinterläßt. Und er beerbt sie, wenn sie keine Kinder hat. Und wenn es zwei (Schwestern) sind, stehen ihnen (beiden) zwei Drittel dessen zu, was er hinterläßt. Und wenn es Geschwister sind, Männer und Frauen, dann kommt einem männlichen Geschlechts ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts. Allah gibt euch Klarheit, damit ihr (nicht) in die Irre geht. Allah weiß über alles Bescheid.
- **3:185** – Jede Seele wird den Tod kosten. Und erst am Tag der Auferstehung wird euch euer Lohn in vollem Maß zukommen. Wer dann dem (Höllen)feuer entrückt und in den (Paradies)garten eingelassen wird, der hat fürwahr einen Erfolg erzielt. Und das diesseitige Leben ist nur trügerischer Genuß.
- **23:99** – Wenn dann der Tod zu einem von ihnen kommt, sagt er: „Mein Herr, bringt mich zurück,
- **23:100** – auf daß ich rechtschaffen handele in dem, was ich hinterlassen habe. Keineswegs! Es ist nur ein Wort, das er (so) sagt; hinter ihnen wird ein trennendes Hindernis sein bis zu dem Tag, da sie auferweckt werden.
- **42:38** – und diejenigen, die auf ihren Herrn hören und das Gebet verrichten, ihre Angelegenheit(en) durch Beratung untereinander (regeln) und von dem ausgeben, womit Wir sie versorgt haben,
- **59:18** – O die ihr glaubt, fürchtet Allah. Und eine jede Seele schaue, was sie für morgen vorausschickt. Und fürchtet Allah; gewiß, Allah ist Kundig dessen, was ihr tut.

Hinweise: In 23:99 öffnet ein Anführungszeichen „, das in 23:100 im QuranEnc-Text nicht geschlossen wird. Das ist so geliefert und nicht korrigiert. 42:38 ist im Original ein Satzfragment (Fortsetzung von 42:36–37). Die arabischen Texte stehen nur in der JSON-Datei, um Unicode-Fehler durch Abschreiben zu vermeiden.

---

## Teil 3 – Hadith-Korrekturen

Quellen: hadith-api über jsDelivr (`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{eng,ara}-<buch>/<n>.json`, Abruf 2026-10-30T12:19:41Z; Muslim über `eng-muslim.min.json`/`ara-muslim.min.json`) sowie ihadis.com per WebFetch für Muslim 977a und Tirmidhi 1054. sunnah.com selbst: HTTP 403, **nicht direkt gegengeprüft**. Die sunnah.com-URLs unten folgen dem bekannten Muster und sind nicht abgerufen.

### 3.1 Qirat-Hadith (Record `hadith-bukhari-janazah-1254`, Nummer falsch)
- **Richtig:** Sahih al-Bukhari **1325**, In-book: Book 23 (Janaʾiz), Hadith 81. URL: `https://sunnah.com/bukhari:1325`
- Parallele: Sahih Muslim 945 (hadith-api `arabicnumber` 945.01, In-book 11/67; entspricht vermutlich sunnah.com `muslim:945a`. Die Zuordnung .01 → a ist **nicht gegengeprüft**.)
- Matn (Bukhari 1325, Prophetenwort): «مَنْ شَهِدَ الْجَنَازَةَ حَتَّى يُصَلِّيَ عَلَيْهَا فَلَهُ قِيرَاطٌ، وَمَنْ شَهِدَ حَتَّى تُدْفَنَ كَانَ لَهُ قِيرَاطَانِ». قِيلَ وَمَا الْقِيرَاطَانِ قَالَ «مِثْلُ الْجَبَلَيْنِ الْعَظِيمَيْنِ»
- Inhalt: Wer bei der Janaza bis zum Gebet dabei ist, erhält ein Qirat. Wer bis zur Beerdigung bleibt, erhält zwei. Auf die Frage, was zwei Qirat seien: wie zwei gewaltige Berge.
- Gradierung: sahih (Sahih al-Bukhari, keine Einzelnote nötig).
- Textkorrektur: Die bisherige Wiedergabe „folgt und … verrichtet / wer wartet, bis begraben ist“ angleichen an „bis das Gebet verrichtet ist … bis zur Beerdigung“.
- Bukhari 1254 (Umm ʿAtiyya, Waschung der Tochter des Propheten) bleibt als Beleg für Ghusl nutzbar.

### 3.2 Gräberbesuch (Record `hadith-bukhari-janazah-1273`, Sammlung und Nummer falsch)
**Variante A – Sahih Muslim 977a**
- In-book: Book 11, Hadith 136; USC-MSA: Book 4, Hadith 2131 (ihadis.com; hadith-api `arabicnumber` 977.01, In-book 11/136, übereinstimmend). URL: `https://sunnah.com/muslim:977a`
- Matn (Prophetenwort): «نَهَيْتُكُمْ عَنْ زِيَارَةِ الْقُبُورِ فَزُورُوهَا وَنَهَيْتُكُمْ عَنْ لُحُومِ الأَضَاحِيِّ فَوْقَ ثَلاَثٍ فَأَمْسِكُوا مَا بَدَا لَكُمْ وَنَهَيْتُكُمْ عَنِ النَّبِيذِ إِلاَّ فِي سِقَاءٍ فَاشْرَبُوا فِي الأَسْقِيَةِ كُلِّهَا وَلاَ تَشْرَبُوا مُسْكِرًا»
- Inhalt: Drei frühere Verbote werden aufgehoben: Gräberbesuch (jetzt erlaubt), Aufbewahren von Opferfleisch über drei Tage, Nabidh-Gefäße. Berauschendes bleibt verboten. **Ohne** den Zusatz „erinnert an das Jenseits“.
- Gradierung: sahih (Sahih Muslim); ihadis zeigt „Sahih Hadith“.

**Variante B – Jamiʿ at-Tirmidhi 1054** (enthält den Jenseits-Zusatz)
- In-book: Book 10, Hadith 90; englische Ausgabe: Vol. 2, Book 5, Hadith 1054 (ihadis.com; hadith-api In-book 10/90). URL: `https://sunnah.com/tirmidhi:1054`
- Matn (Prophetenwort): «قَدْ كُنْتُ نَهَيْتُكُمْ عَنْ زِيَارَةِ الْقُبُورِ فَقَدْ أُذِنَ لِمُحَمَّدٍ فِي زِيَارَةِ قَبْرِ أُمِّهِ فَزُورُوهَا فَإِنَّهَا تُذَكِّرُ الآخِرَةَ»
- Inhalt: Das Verbot des Gräberbesuchs ist aufgehoben. Muhammad wurde der Besuch am Grab seiner Mutter erlaubt. Besucht sie, denn sie erinnern an das Jenseits.
- Gradierungen: **at-Tirmidhi selbst:** «حَدِيثُ بُرَيْدَةَ حَدِيثٌ حَسَنٌ صَحِيحٌ» (im arabischen Text enthalten). Laut hadith-api: Al-Albani „Sahih“, Ahmad Muhammad Shakir „Sahih“, Bashar Awad Maarouf „Hasan Sahih“, Zubair Ali Zai „Sahih Muslim“ (d. h. Verweis auf Muslim). Laut Websuche zeigt sunnah.com „Sahih (Darussalam)“, **nicht direkt verifiziert**.
- Empfehlung: Variante B mit Gradierung „ḥasan ṣaḥīḥ (at-Tirmidhī); ṣaḥīḥ (al-Albānī)“, `auditCategory` nicht `SAHIH_PRIMARY`, plus Verweis „vgl. Muslim 977a“. Oder Variante A mit gekürzter Wiedergabe ohne Jenseits-Zusatz.

### 3.3 Saʿd-Erzählung (Record `hadith-wasiyyah-saad`, 2738 falsch)
| Nummer | In-book | Was Saʿd anbietet | Kernaussage | URL |
|---|---|---|---|---|
| Bukhari **1295** | Book 23, Hadith 53 | zwei Drittel (أَفَأَتَصَدَّقُ بِثُلُثَىْ مَالِي), dann die Hälfte | «الثُّلُثُ وَالثُّلْثُ كَبِيرٌ ـ أَوْ كَثِيرٌ ـ إِنَّكَ أَنْ تَذَرَ وَرَثَتَكَ أَغْنِيَاءَ خَيْرٌ مِنْ أَنْ تَذَرَهُمْ عَالَةً يَتَكَفَّفُونَ النَّاسَ» | `https://sunnah.com/bukhari:1295` |
| Bukhari **2742** | Book 55, Hadith 5 | alles (أُوصِي بِمَالِي كُلِّهِ), dann die Hälfte | «فَالثُّلُثُ، وَالثُّلُثُ كَثِيرٌ …» | `https://sunnah.com/bukhari:2742` |
| Bukhari **2744** | Book 55, Hadith 7 | die Hälfte | «الثُّلُثُ، وَالثُّلُثُ كَثِيرٌ أَوْ كَبِيرٌ», danach: «فَأَوْصَى النَّاسُ بِالثُّلُثِ، وَجَازَ ذَلِكَ لَهُمْ» | `https://sunnah.com/bukhari:2744` |

- Inhalt (gemeinsam): Saʿd ist krank, hat nur eine Tochter als Erbin und will einen großen Teil seines Vermögens vermachen bzw. spenden. Der Prophet lehnt ab und erlaubt ein Drittel: „ein Drittel, und ein Drittel ist viel“. Es sei besser, die Erben wohlhabend zu hinterlassen als bedürftig.
- Gradierung: sahih (Bukhari).
- Empfehlung: `hadith-wasiyyah-saad` → **Bukhari 2744** (Kapitel Wasiyya, und mit dem Zusatz, dass die Leute danach ein Drittel vermachten). Oder 1295 mit „zwei Drittel“. „Fast sein gesamtes Vermögen“ passt nur zu 2742 („alles“), und 2742 ist schon in `hadith-wasiyyah-third` belegt.
- **Bukhari 2738** (Ibn ʿUmar, In-book 55/1): «مَا حَقُّ امْرِئٍ مُسْلِمٍ لَهُ شَىْءٌ، يُوصِي فِيهِ يَبِيتُ لَيْلَتَيْنِ، إِلاَّ وَوَصِيَّتُهُ مَكْتُوبَةٌ عِنْدَهُ». Inhalt: Ein Muslim, der etwas zu vermachen hat, soll keine zwei Nächte ohne schriftliches Testament verbringen. Ein guter eigener Beleg für „Testament schriftlich bereithalten“, URL `https://sunnah.com/bukhari:2738`.

### 3.4 Schulden (Record `hadith-debts-deceased`, Nummer korrekt, Wiedergabe ungenau)
- Sahih al-Bukhari **2289**, In-book: Book 38 (Hawala), Hadith 3. URL: `https://sunnah.com/bukhari:2289`
- Matn (Schlussteil): قَالَ «هَلْ تَرَكَ شَيْئًا». قَالُوا لاَ. قَالَ «فَهَلْ عَلَيْهِ دَيْنٌ». قَالُوا ثَلاَثَةُ دَنَانِيرَ. قَالَ «صَلُّوا عَلَى صَاحِبِكُمْ». قَالَ أَبُو قَتَادَةَ صَلِّ عَلَيْهِ يَا رَسُولَ اللَّهِ، وَعَلَىَّ دَيْنُهُ. فَصَلَّى عَلَيْهِ.
- Inhalt: Drei Verstorbene werden gebracht. Für den ohne Schulden und den mit Schulden, aber ausreichendem Nachlass (drei Dinar) betet der Prophet. Beim dritten (drei Dinar Schulden, kein Nachlass) sagt er: „Betet für euren Gefährten.“ Erst als Abu Qatada die Schuld übernimmt, betet er.
- Gradierung: sahih (Bukhari).
- Korrektur: Er fragte nicht, wer die Schuld übernimmt, sondern verweigerte zunächst selbst das Gebet.

---

## Was offen bzw. nicht verifiziert ist
1. **Rechtekette Bubenheim/Elyas → QuranEnc**: nicht belegt. QuranEnc-Bedingungen liegen vor, eine Bestätigung des Rechteinhabers (KFGQPC / Islamisches Zentrum Aachen) nicht. Die KFGQPC-Copyright-Seite lieferte 404.
2. **sunnah.com-Nutzungsbedingungen**: Wortlaut nicht abrufbar (HTTP 403), nur Suchzusammenfassung. Alle sunnah.com-URLs nicht direkt geprüft.
3. **Herkunft der Gradierungen in hadith-api**: im Repo undokumentiert. „Sahih (Darussalam)“ für Tirmidhi 1054 nur per Suchtreffer.
4. Muslim 945a (Qirat-Parallele): Buchstaben-Zuordnung nicht gegengeprüft.
5. Lebensdaten Rassoul (eine Quelle), Zaidan, Bobzin, Bubenheim: nicht primär belegt. Für die Empfehlung ohne Belang, da alle Werke ohnehin geschützt sind.
6. Henning 1901: Gemeinfreiheit plausibel (Tod 1927). Den Scan habe ich nicht geöffnet, Versnummern und Wortlaut nicht geprüft.
7. Rechtliche Würdigung (Teilzitate unter „No deletion“, Schutz moderner Hadith-Editionen) ist eine Einschätzung, keine Rechtsberatung.

Tests: `NOT_RUN` (reine Recherche).
