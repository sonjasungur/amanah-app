# Freigabe von Wissensinhalten, Hadith-Quellen und Nutzungsrechte (Stand 02.11.2026)

**Für:** Owner, Gelehrtenprüfung, Rechtsprüfung, Betrieb. **Stand:** lokal, nicht deployt. Dieses Dokument ist **keine religiöse oder rechtliche Freigabe**. Es hält fest, was vorliegt und was fehlt.

## 1. Regel (Owner-Entscheidung 02.11.2026)

Religiöse oder rechtliche Inhalte erscheinen nur als „geprüft“ und nur öffentlich, wenn ein dokumentierter fachlicher Prüfbeleg existiert. Das Wissenszentrum bleibt dauerhaft kostenlos und veröffentlicht nur geprüfte Inhalte.

**Umsetzung im Code:**

- `hasReviewEvidence` (`src/lib/knowledge/safety.ts`): `reviewed` zählt nur zusammen mit Prüfer, Datum und Dokument (`reviewEvidence`). Der Status allein öffnet nichts.
- `orientation`: rein organisatorische Hilfe ohne individuelle rechtliche, medizinische oder religiöse Aussagen. Vorläufig öffentlich (Owner 02.11.2026), ausdrücklich als „Organisationsinformation, nicht fachlich geprüft“.
- Katalogartikel: weiterhin `isPublishable` mit Prüfungen je Version (`src/modules/islamic-knowledge/workflow.ts`).
- Browsercode: Wissensdaten dürfen von keiner Client-Komponente aus erreichbar sein (`src/__tests__/knowledge-client-bundle.test.ts`).
- KI: `/api/ai` und `/api/ai/knowledge` antworten nur aus freigegebenen Einträgen. Eine Frage zu einem gesperrten Thema erhält „noch kein freigegebener Eintrag“. Freie Modellantworten im Chat gibt es nicht mehr.
- Release-Prüfung: `scripts/validate-release.mjs` verlangt diesen Filter.

## 2. Bestand mit Kennzeichnung „reviewed“ vor der Bereinigung

Für keinen dieser Einträge liegt ein Prüfbeleg vor; `entries.ts` setzte pauschal das Datum 2026-07-01 ([Doku 04](04-wissenszentrum.md) §1.2).

| Inhalt | Sichtbar über | Jetzt |
|---|---|---|
| `pv-what`, `pv-muslim`, `pv-religious`, `pv-vollmacht` | `/patientenverfuegung` mit Hinweis „Geprüft“ | gesperrt, Seite zeigt nur Bereichsübersicht |
| `kb-vorsorgevollmacht-allgemein`, `kb-patientenverfuegung-allgemein`, `kb-bestattungswuensche-allgemein`, `kb-janazah-begriffe`, `kb-ghusl-kafan`, `kb-sadaqa-jariya`, `kb-digitaler-nachlass` | `/api/knowledge/entries`, Einzelabruf, Suche, KI | gesperrt (`needs_review`) |
| `kb-notfallmappe-allgemein`, `kb-notfallkontakte`, `kb-dokumentenuebersicht`, `kb-familiennachricht`, `kb-app-grenzen` | wie oben, als „Geprüfte Wissensbasis“ | öffentlich als `orientation`, ohne „geprüft“ |
| `janazah-germany`, `barzakh-forgiveness`, `barzakh-family`, `erbe-deutschland`, `sj-foerderkreis` | nur intern (Prüfpakete) | `needs_scholar_review` |
| Hadith `hadith-sadaqa-jariya` | Startseite, Abschnitt Akhira | entfernt |

**Die Zuordnung zu `orientation` ist meine Einschätzung** und gehört mit in die Prüfung. Die fünf Einträge verweisen teils auf Vollmacht und Anwalt, treffen aber keine eigene Rechtsaussage.

**Sprachlich neutralisiert, vom Owner vorläufig akzeptiert, vor öffentlicher Freigabe fachlich zu prüfen:** `/akuter-todesfall` (Schritte 4 und 6: „Unnötige Verzögerung vermeiden“ entfällt), `/konvertierte` („sonst entscheidet das deutsche System allein“ entfällt), `/wissen` („Eine Sadaqa Jāriya“ entfällt).

**Weiter öffentlich, zu prüfen:** organisatorische Texte mit religiösem Bezug: Akhira-Kacheln und die Worterklärung „Akhira bezeichnet das Jenseits“ auf der Startseite, die Schrittfolge auf `/akuter-todesfall`, die Checkliste auf `/konvertierte`, Fragen und Hinweise des Vorsorge-Checks (`src/lib/check/`). Sie treffen keine Aussage zu Pflichten oder Belohnung, verwenden aber religiöse Begriffe.

**Hinter der Anmeldung, nicht bewertet:** Hinweise in den Modulen unter `/dashboard` (`barzakh`, `ghusl-kafan`, `sadaqa-jariya`, `bestattung`, `testament` und andere).

## 3. Hadith: Wortlaut, Quelle, Rechte

Quelle der Daten: `src/lib/knowledge/sources.ts`. Liegt jetzt nur noch serverseitig und wird derzeit nirgends öffentlich angezeigt. **Wortlaute unverändert aus den Daten übernommen; sie sind nicht freigegeben.**

| ID | Referenz | Wortlaut im Projekt | Art | Verweis |
|---|---|---|---|---|
| `hadith-janazah-hasten` | Sahih al-Bukhari, Hadith 1315 · Sahih Muslim, Hadith 944c | Beschleunigt die Janazah. Wenn sie rechtschaffen war, ist es ein Gutes, das ihr ihr zukommen lasst. Wenn sie anders war, ist es ein Übel, das ihr von euch abwendet. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:1315 |
| `hadith-janazah-qirat` | Sahih al-Bukhari, Hadith 1325 (Buch 23, Hadith 81) | Wer bei der Janāza anwesend ist, bis das Gebet über sie verrichtet wurde, erhält ein Qīrāṭ; wer anwesend ist, bis sie begraben wurde, erhält zwei Qīrāṭ. Auf die Frage, was zwei Qīrāṭ seien, sagte er: wie zwei gewaltige Berge. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:1325 |
| `hadith-ghusl-umm-atiyya` | Sahih al-Bukhari, Hadith 1254 | Umm ʿAṭiyya berichtet, dass der Prophet bei der Waschung seiner verstorbenen Tochter anwies, sie mit Wasser und Sidr zu waschen und zuletzt Kampfer zu verwenden. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:1254 |
| `hadith-kafan-three-white` | Sahih al-Bukhari, Hadith 1273 | ʿĀʾischa berichtet, dass der Prophet in drei weiße Tücher gehüllt wurde. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:1273 |
| `hadith-graves-visit` | Jāmiʿ at-Tirmidhī, Hadith 1054 (Buch 10, Hadith 90) · vgl. Sahih Muslim 977a | Ich hatte euch den Besuch der Gräber verboten. Muhammad wurde erlaubt, das Grab seiner Mutter zu besuchen. So besucht sie, denn sie erinnern an das Jenseits. | eigene sinngemäße Wiedergabe | https://sunnah.com/tirmidhi:1054 |
| `hadith-sadaqa-jariya` | Sahih Muslim, Hadith 1631 | Wenn der Mensch stirbt, enden seine Taten außer drei: fortlaufende Sadaqa, nützliches Wissen und ein rechtschaffenes Kind, das für ihn bittet. | eigene sinngemäße Wiedergabe | https://sunnah.com/muslim:1631 |
| `hadith-wasiyyah-third` | Sahih al-Bukhari, Hadith 2742 · Sahih Muslim, Hadith 1628a | Ein Drittel, und ein Drittel ist viel. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:2742 |
| `hadith-wasiyyah-saad` | Sahih al-Bukhari, Hadith 2744 (Buch 55, Hadith 7) | Saʿd wollte die Hälfte seines Vermögens vermachen. Der Prophet erlaubte ein Drittel und sagte: Ein Drittel, und ein Drittel ist viel. Danach vermachten die Leute ein Drittel, und das wurde ihnen gestattet. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:2744 |
| `hadith-wasiyya-written` | Sahih al-Bukhari, Hadith 2738 (Buch 55, Hadith 1) | Ein Muslim, der etwas zu vermachen hat, soll keine zwei Nächte verbringen, ohne dass sein Testament schriftlich bei ihm liegt. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:2738 |
| `hadith-debts-deceased` | Sahih al-Bukhari, Hadith 2289 (Buch 38, Hadith 3) | Ein Verstorbener ohne Nachlass, aber mit drei Dinar Schulden, wurde gebracht. Der Prophet verrichtete das Totengebet zunächst nicht selbst und sagte: Betet für euren Gefährten. Erst als Abu Qatada die Schuld übernahm, betete er für ihn. | eigene sinngemäße Wiedergabe | https://sunnah.com/bukhari:2289 |

**Herkunft und Rechte:**

- **Deutsche Fassungen:** Laut Kennzeichnung eigene sinngemäße Wiedergaben, keine lizenzierte Übersetzung. Dass sie nicht aus einer geschützten Übersetzung abgeleitet sind, ist **nicht belegt**; die Entstehung ist im Repo nur als „Eigene sinngemäße Wiedergabe (Stand 2026-10-30)“ vermerkt. Rechtsprüfung offen.
- **Arabische Texte:** Hadith-Records enthalten keinen arabischen Text ([Doku 05](05-quellenpruefung.md)).
- **Links:** Sie verweisen auf sunnah.com. Es werden keine Inhalte von dort übernommen. Der automatische Abruf war gesperrt (HTTP 403), geprüft wurde die Nummerierung über eine Ersatzquelle.
- **Einstufungen:** Die Kategorie `SAHIH_PRIMARY` und Einstufungen stammen nicht aus einem dokumentierten Prüfverfahren; ihre Herkunft ist ungeklärt ([Doku 23](23-wissenszentrum-pruefpakete-und-lizenz.md) §3).
- **Abweichungen:** `hadith-graves-visit` (Tirmidhi) ist keine Sahih-Sammlung im Sinne von Bukhari/Muslim und braucht eine eigene Einstufung ([Doku 05](05-quellenpruefung.md)).
- **Qur'an:** Bubenheim/Elyas über QuranEnc, Bedingungen und offene Rechtekette siehe [Doku 23](23-wissenszentrum-pruefpakete-und-lizenz.md) §2. Nur in unveröffentlichten Entwürfen.

Keine dieser Angaben ersetzt die Prüfung durch Gelehrte oder eine Rechtsprüfung. Es wurde niemand kontaktiert.

## 4. Fehlende fachliche Prüfungen

| Prüfung | Gegenstand | Wer |
|---|---|---|
| Religiös | 44 Katalogartikel, Einträge `kb-janazah-begriffe`, `kb-ghusl-kafan`, `kb-sadaqa-jariya`, `kb-bestattungswuensche-allgemein`, `kb-janazah-deutschland`, alle Hadith-Wortlaute und Einstufungen, religiöse Begriffe aus §2 | Gelehrte |
| Rechtlich | Vollmacht, Patientenverfügung, digitaler Nachlass, Erbe; Formulierungen auf `/akuter-todesfall`, `/konvertierte`; Einordnung `orientation` | Anwalt oder Notar |
| Medizinisch | Patientenverfügung | Arzt oder Fachperson |
| Nutzungsrechte | Hadith-Wiedergaben, Qur'an-Übersetzung | Rechtsprüfung, QuranEnc |

**Freischalten:** `reviewEvidence` mit Prüfer, Datum und Dokument eintragen und Status setzen. Die Regressionstests in `src/__tests__/public-knowledge-access.test.ts` schlagen dann bewusst an und sind mit der Freigabe anzupassen.

## 5. Tests

`src/__tests__/public-knowledge-access.test.ts`, `src/__tests__/knowledge-client-bundle.test.ts` und `e2e/public-knowledge-anonymous.spec.ts` (ohne Konto: Seiten, direkte URLs, APIs, Suche, Sitemap, ausgeliefertes JavaScript).
