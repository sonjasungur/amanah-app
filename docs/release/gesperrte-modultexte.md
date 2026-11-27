# Gesperrte Modultexte (Stand 02.11.2026)

**Für:** Fachprüfer und Owner. Originale wortgetreu aus dem Code entnommen, **nicht geprüft und nicht freigegeben**. Diese Datei liegt außerhalb von `src/` und wird nicht ausgeliefert.

**Owner-Entscheidung 02.11.2026:** Die klaren Aussagen und vorsorglich alle Grenzfälle bleiben gesperrt, bis ein Prüfbeleg vorliegt. Neutrale Organisationshinweise bleiben sichtbar, ohne Prüfbehauptung.

**Freischalten:** In `src/lib/content/module-texts.ts` beim Eintrag `released` mit Text, Prüfer, Datum und Dokument ergänzen. Ohne vollständigen Beleg bleibt der neutrale Text aktiv. Der Test `src/__tests__/module-text-lock.test.ts` schlägt dann bewusst an und ist mit der Freigabe anzupassen.

### `testament-form-pdf`

- **Datei:** `src/app/dashboard/pdf/page.tsx`
- **Art:** Recht, klar
- **Grund der Sperre:** Formvorschrift mit Paragraf
- **Original:** Dieses Blatt ist kein Testament: Ein eigenhändiges Testament muss vollständig handschriftlich geschrieben und unterschrieben sein (§ 2247 BGB).
- **Jetzt:** Formfragen klärt ein Anwalt oder Notar.

### `testament-form-print`

- **Datei:** `src/components/print/print-views.tsx`
- **Art:** Recht, klar
- **Grund der Sperre:** Formvorschrift mit Paragraf
- **Original:** Ein eigenhändiges Testament muss vollständig von Hand geschrieben und unterschrieben sein (§ 2247 BGB).
- **Jetzt:** Formfragen klärt ein Anwalt oder Notar.

### `vorsorge-documents-print`

- **Datei:** `src/components/print/print-views.tsx`
- **Art:** Recht, klar
- **Grund der Sperre:** Aussage zu erforderlichen Dokumenten
- **Original:** Vollmacht und Patientenverfügung brauchen eigene, unterschriebene Dokumente.
- **Jetzt:** Zu Vollmacht und Patientenverfügung berät ein Anwalt, Notar oder Arzt.

### `hint-allah-decides`

- **Datei:** `src/components/print/print-views.tsx`
- **Art:** Religion, Grenzfall
- **Grund der Sperre:** Glaubensaussage im Namen des Nutzers
- **Original:** Allah entscheidet.
- **Jetzt:** (entfernt, der Abschnitt bleibt mit den übrigen Sätzen vollständig)

### `doc-vollmacht`

- **Datei:** `src/lib/vorsorge/documents.ts`
- **Art:** Recht, klar
- **Grund der Sperre:** Aussage zur Verwendung
- **Original:** hint: "Original wird für Bank und Behörden gebraucht"
- **Jetzt:** Wo liegt das Original, und wer hat eine Kopie?

### `doc-testament`

- **Datei:** `src/lib/vorsorge/documents.ts`
- **Art:** Recht, klar
- **Grund der Sperre:** Aussage zu Formen und Verwahrung
- **Original:** hint: "Eigenhändig oder notariell; ggf. amtliche Verwahrung"
- **Jetzt:** Wo liegt es, und wer weiß davon?

### `doc-ausweis`

- **Datei:** `src/lib/vorsorge/documents.ts`
- **Art:** Recht, klar
- **Grund der Sperre:** Aussage zu behördlichen Verfahren
- **Original:** hint: "Wird für Sterbeurkunde und Überführung gebraucht"
- **Jetzt:** Wo liegt der Ausweis?

### `schulden-intro`

- **Datei:** `src/app/dashboard/schulden-amanah/page.tsx`
- **Art:** Religion, klar
- **Grund der Sperre:** Pflicht vor dem Tod
- **Original:** Ordne offene Rechte und Pflichten — Schulden, Amanah, Zakat und Versprechen, die vor dem Tod erledigt werden sollten.
- **Jetzt:** Ordne offene Punkte: Schulden, anvertraute Dinge, Zakat und Versprechen.

### `letter-vollmacht`

- **Datei:** `src/lib/export/family-letter-template.ts`
- **Art:** Recht, klar
- **Grund der Sperre:** Behauptet Berechtigung und Dokument ohne Prüfung
- **Original:** darf für mich entscheiden (Dokument liegt im Ordner).
- **Jetzt:** benannte Person. Ob ein Dokument vorliegt und wo, bitte selbst ergänzen.

### `letter-janazah`

- **Datei:** `src/lib/export/family-letter-template.ts`
- **Art:** Religion, klar
- **Grund der Sperre:** Legt religiöse Überzeugungen vor
- **Original:** `- Mir ist wichtig: islamische Grundsätze, zeitnahe Janazah, Würde bei Ghusl und Kafan. Keine teuren kulturellen Feiern, die euch belasten.`
- **Jetzt:** - Mir ist wichtig: [bitte in eigenen Worten ergänzen]

### `letter-schulden`

- **Datei:** `src/lib/export/family-letter-template.ts`
- **Art:** Religion, Recht, klar
- **Grund der Sperre:** Reihenfolge bei der Nachlassverteilung
- **Original:** bitte fachlich klären, bevor der Nachlass verteilt wird.
- **Jetzt:** Einzelheiten stehen im Ordner.

### `janazah-donation-desc`

- **Datei:** `src/lib/i18n/translations.ts`
- **Art:** Religion, Recht, Grenzfall
- **Grund der Sperre:** „zulässig“ setzt eine Grenze voraus, die nicht benannt und nicht geprüft ist
- **Original:** "janazah.section.persoenlich.desc": "Nachrichten, Verpflichtungen und Spendenwünsche im zulässigen Rahmen."
- **Jetzt:** Nachrichten, Verpflichtungen und Spendenwünsche.

### `janazah-donation-field`

- **Datei:** `src/lib/i18n/translations.ts`
- **Art:** Religion, Recht, Grenzfall
- **Grund der Sperre:** wie oben
- **Original:** "janazah.field.donationWishes": "Gewünschte Spenden oder Sadaqah (im zulässigen Rahmen)"
- **Jetzt:** Gewünschte Spenden oder Sadaqah

### `janazah-donation-desc-en`

- **Datei:** `src/lib/i18n/translations.ts`
- **Art:** Religion, Recht, Grenzfall
- **Grund der Sperre:** englische Fassung
- **Original:** "janazah.section.persoenlich.desc": "Messages, obligations and donation wishes within permissible scope."
- **Jetzt:** Messages, obligations and donation wishes.

### `janazah-donation-field-en`

- **Datei:** `src/lib/i18n/translations.ts`
- **Art:** Religion, Recht, Grenzfall
- **Grund der Sperre:** englische Fassung
- **Original:** "janazah.field.donationWishes": "Desired donations or Sadaqah (within permissible scope)"
- **Jetzt:** Desired donations or Sadaqah

### `vollmacht-intro`

- **Datei:** `src/app/dashboard/vollmacht/page.tsx`
- **Art:** Recht, Grenzfall
- **Grund der Sperre:** Beschreibt die Rechtswirkung einer Vollmacht
- **Original:** description="Lege fest, wer in deinem Namen entscheiden darf — medizinisch, behördlich und finanziell."
- **Jetzt:** Notiere, wen du dafür vorgesehen hast und wo das Dokument liegt.

### `betreuung-intro`

- **Datei:** `src/app/dashboard/betreuung/page.tsx`
- **Art:** Recht, Grenzfall
- **Grund der Sperre:** Beschreibt die Rechtswirkung einer Verfügung
- **Original:** description="Bestimme, wer dich betreuen soll — und wer ausdrücklich nicht."
- **Jetzt:** Notiere deine Wünsche und wo das Dokument liegt.

### `sadaqa-intro`

- **Datei:** `src/app/dashboard/sadaqa-jariya/page.tsx`
- **Art:** Religion, Grenzfall
- **Grund der Sperre:** Wertende religiöse Aussage
- **Original:** description="Das Gute, das nach dir bleibt — Waqf, Spenden und laufende Taten der Nächstenliebe."
- **Jetzt:** Halte deine Wünsche zu Spenden, Waqf und Projekten fest.

### `sadaqa-tile`

- **Datei:** `src/lib/modules/config.ts`
- **Art:** Religion, Grenzfall
- **Grund der Sperre:** Wertende religiöse Aussage
- **Original:** description: "Das Gute, das nach dir bleibt."
- **Jetzt:** Deine Wünsche zu Spenden und Projekten.

### `janazah-wish-help`

- **Datei:** `src/lib/guided-flow/question-plan.ts`
- **Art:** Religion, Grenzfall
- **Grund der Sperre:** Beispiel legt eine religiöse Haltung nahe
- **Original:** helpText: "Freitext — z. B. schlichte Janazah, keine aufwendigen Feiern."
- **Jetzt:** Freitext — dein Wunsch in deinen eigenen Worten.

### `amanah-return-question`

- **Datei:** `src/lib/familiengespraech/topics.ts`
- **Art:** Religion, Grenzfall
- **Grund der Sperre:** Frage setzt eine Pflicht voraus
- **Original:** text: "Gibt es Amanah, die zurückgegeben werden muss?"
- **Jetzt:** Gibt es anvertraute Dinge, die noch bei dir liegen?

### `testament-form-vorbereitung`

- **Datei:** `src/app/dashboard/testament/vorbereitung/page.tsx` (zusätzlich hinter `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION`, lag aber im Browser-Code)
- **Art:** Recht, klar
- **Grund der Sperre:** Formvorschrift mit Paragraf
- **Original:** Ein eigenhändiges Testament muss vollständig von Hand geschrieben und unterschrieben sein (§ 2247 BGB).
- **Jetzt:** Formfragen klärt ein Anwalt oder Notar.

## Entfernte Sprachfassungen (nicht übersetzt, Rückfall auf Deutsch)

- `tr` "hero.title": "İslami olarak hazırlıklı — aileniz en zor anda karar vermek zorunda kalmadan önce.",
- `tr` "hero.subtitle": "Hastalık, yaşam vasiyeti, cenaze, vasiyet, borçlar, Barzah ve Sadaka-i Cariye için Mein Wille oluşturun.",
- `tr` "hero.claim": "Hastalık için. Cenaze için. Barzah için. Aileniz için.",
- `tr` "review.badge": "İlmî inceleme altında",
- `ar` "hero.title": "مستعد إسلامياً — قبل أن يضطر أهلك للقرار في أصعب لحظة.",
- `ar` "hero.subtitle": "أنشئ مجلد الأمانة للمرض والوصية الحية والجنازة والميراث.",
- `ar` "hero.claim": "للمرض. للجنازة. للبرزخ. لعائلتك.",
- `ar` "review.badge": "قيد المراجعة الشرعية",
- `bs` "hero.title": "Islamski pripremljeni — prije nego što vaša porodica mora odlučiti.",
- `bs` "hero.subtitle": "Kreirajte Mein Wille za bolest, dženazu, testament i druge pripreme.",
- `bs` "hero.claim": "Za bolest. Za dženazu. Za barzah. Za porodicu.",
- `bs` "review.badge": "U naučnoj provjeri",
- `sq` "hero.title": "I përgatitur islamikisht — para se familja juaj të vendosë.",
- `sq` "hero.subtitle": "Krijoni Mein Wille për sëmundje, xhenaze, testament dhe përgatitje të tjera.",
- `sq` "hero.claim": "Për sëmundjen. Për xhenazen. Për barzahun. Për familjen.",
- `sq` "review.badge": "Në shqyrtim fetar",
