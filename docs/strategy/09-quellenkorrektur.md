# Quellenkorrektur Wissenszentrum – Plan, Lizenzstatus und Umsetzungsstand

Stand: 2026-10-30 · Branch `feat/vorsorge-testament-foundation` · Grundlage: [05-quellenpruefung.md](05-quellenpruefung.md), Lizenz- und Textrecherche [09a-lizenz-und-texte-recherche.md](09a-lizenz-und-texte-recherche.md)
Keine Fatwa, keine Rechtsberatung. Kein Prüfer, kein Freigabedatum und keine Quelle wurde erfunden; alle Artikel bleiben unveröffentlicht.

---

## 1. Lizenzstatus

| Material | Quelle | Bedingungen | Status |
|---|---|---|---|
| Deutsche Qur'an-Übersetzung | ʿAbdullah as-Sāmit (Frank Bubenheim) und Dr. Nadim Elias, QuranEnc.com `german_bubenheim`, **Version 1.1.4** (Stand 2025-02-03) | QuranEnc „Terms and Policies“: keine Änderung/Kürzung, Herausgeber und QuranEnc nennen, Version nennen, Begleitangaben mitführen, Anmerkungen an QuranEnc melden, auf neueste Version aktualisieren, keine unangemessene Werbung | **Bedingungen umgesetzt.** Offen: schriftliche Bestätigung, dass QuranEnc für die Rechteinhaber (König-Fahd-Komplex bzw. Übersetzer) freigeben darf → **Owner** |
| Arabischer Qur'antext | Tanzil Uthmani 1.1, tanzil.net | CC BY 3.0 + Tanzil-Bedingungen: unverändert, Quelle nennen, Link auf tanzil.net, Copyright-Block erhalten | **Umgesetzt** (Copyright-Block in `src/lib/knowledge/data/quran-verbatim.json`, Nennung in `QURAN_ATTRIBUTION`) |
| Hadith-Matn (Arabisch) | klassische Sammlungen | gemeinfrei; moderne Editionen evtl. geschützt | geringes Risiko bei kurzen Zitaten, **rechtlich nicht abschließend geprüft** |
| Hadith-Übersetzungen | – | sunnah.com ohne öffentliche Inhaltslizenz; englische Übersetzungen fremder Verlage | Nur **eigene sinngemäße Wiedergaben** (gekennzeichnet). Ziel: eigene Übersetzung durch qualifizierte Person mit Namensnennung |
| Gradierungen | at-Tirmidhī (im arabischen Text); weitere über hadith-api | Herkunft der hadith-api-Angaben nicht dokumentiert | als „Herkunft nicht verifiziert“ gekennzeichnet; vor Veröffentlichung gegen gedruckte Ausgabe prüfen |

An QuranEnc zu melden (Bedingung 5, **nicht** erfolgt – externe Kontaktaufnahme nur mit Freigabe): Tippfehler „vom dem“ in 4:12, nicht geschlossenes Anführungszeichen in 23:99–100. Der Text wird unverändert übernommen.

---

## 2. Umgesetzte Korrekturen

### 2.1 Qur'an (alle 7 Records)

- Texte jetzt **wörtlich** aus `src/lib/knowledge/data/quran-verbatim.json` (Deutsch QuranEnc 1.1.4, Arabisch Tanzil). Abgleich: alle 8 arabischen Verse gegen die Tanzil-Originaldatei identisch; deutsche Stichproben (4:11, 4:176, 23:100) und Version durch eigenen API-Abruf bestätigt.
- **4:11** lautet jetzt korrekt: „Einem männlichen Geschlechts kommt ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts.“
- 4:12 und 4:176 nicht mehr gekürzt; Erläuterungen (z. B. Kalāla) im getrennten Hinweisfeld.
- Arabischer Text wird in der Quellenkarte mit `lang="ar" dir="rtl"` angezeigt.
- Alte Texte wörtlich archiviert: `src/modules/islamic-knowledge/archive/2026-10-30-quran-verses.ts` (Abgleich mit Commit `1fdb5db` identisch).
- Tests: `src/__tests__/quran-verbatim.test.ts` (Verstext = gespeicherter Wortlaut, ungekürzt; 4:11-Kernsatz; Quellenangaben; Archiv nicht importiert).

### 2.2 Hadith

| Alt | Neu | Befund |
|---|---|---|
| `hadith-bukhari-janazah-1254` „Qirat“ | `hadith-janazah-qirat` = **Bukhari 1325** | alte ID als Alias → Zitate behalten Bedeutung |
| `hadith-bukhari-janazah-1273` „Gräberbesuch“ | `hadith-graves-visit` = **Tirmidhī 1054** mit Gradierungen (at-Tirmidhī: ḥasan ṣaḥīḥ; al-Albānī, Shākir: ṣaḥīḥ; Maʿrūf: ḥasan ṣaḥīḥ), vgl. Muslim 977a | Kategorie „Hadith mit Authentizitätseinstufung“, nicht „Sahih“ |
| `hadith-wasiyyah-saad` Bukhari 2738 | **Bukhari 2744** | Wiedergabe an 2744 angepasst |
| `hadith-debts-deceased` Bukhari 2289 | gleiche Nummer | Wiedergabe korrigiert: Gebet zunächst verweigert, bis Abu Qatada die Schuld übernahm |
| – | neu: `hadith-ghusl-umm-atiyya` (Bukhari 1254), `hadith-kafan-three-white` (Bukhari 1273), `hadith-wasiyya-written` (Bukhari 2738) | inhaltlich verifizierte Nummern, als Belege für die Startartikel |

Alle Wiedergaben: „Eigene sinngemäße Wiedergabe (Stand 2026-10-30), noch nicht fachlich geprüft“. Alte Records wörtlich archiviert: `archive/2026-10-30-hadith-records.ts`. Neue Regel im Freigabetor: Hadithe außerhalb Bukhari/Muslim brauchen eine Gradierung.

### 2.3 Artikel (Korrekturschicht `catalog.ts`, Version 2, Original im Datensatz)

| Artikel | Korrektur |
|---|---|
| Was ist Barzakh? | „بارزخ“ → „برزخ“; Muslim 1631 als Beleg für fortwirkende Taten ergänzt |
| Deutsches Erbrecht beachten | falsche Quelle (Vorsorgevollmacht) entfernt → Entwurf |
| Kulturfilter 7./40./52. Tag, Traueressen, bezahlte Qur'an-Lesung | Zitate ohne Bezug entfernt → Entwurf |
| Kulturfilter „Familie nicht belasten“ | Beschleunigungs-Hadith → Bukhari 2289 (Schulden) |

Als **offene redaktionelle Hinweise** (sichtbar nur in `/wissen/redaktion`) markiert, nicht umgeschrieben: Gedenktage im Janāza-Artikel, Stiefkinder-Aussage, Waṣiyya-Zustimmungsregel und Vermächtnisverbot an Erben, Prophetenaussage ohne Hadith („lautes Klagen“), „keine Pflicht“-Aussagen zur Überführung, Sadaqa-Jāriya-Beispiele, Partnerbezug Gemeinsam1.

---

## 3. Offener Korrekturplan

| # | Aufgabe | Wer | Blockiert Veröffentlichung? |
|---|---|---|---|
| 1 | Schriftliche Nutzungsbestätigung Bubenheim/Elyas einholen (QuranEnc oder Rechteinhaber) | Owner | ja, für Qur'an-Zitate |
| 2 | Fehlermeldungen 4:12 / 23:99–100 an QuranEnc | Owner (Freigabe für Kontakt) | nein |
| 3 | Fiqh-Quellen `fiqh-ghusl-kafan`, `fiqh-janazah-basics` durch konkrete Werke je Rechtsschule ersetzen | Gelehrte | ja |
| 4 | Hadith-Wiedergaben durch qualifizierte Übersetzung ersetzen oder fachlich abnehmen | Übersetzer/Gelehrte | ja |
| 5 | Gradierungen Tirmidhī 1054 gegen gedruckte Ausgaben prüfen | Quellenprüfer | ja |
| 6 | Muslim 945 (Qirat-Parallele) gegenprüfen | Quellenprüfer | nein |
| 7 | Behörden-URLs ersetzen (BMJ-Ersatz in 05, Verbraucherzentrale neu ermitteln) | Entwicklung | ja, für betroffene Artikel |
| 8 | BGB-Verweise in Praxis-Topics aktualisieren (§ 1901a → § 1827, § 1896 → §§ 1814 ff., § 1358 = Gesundheit) | Jurist | ja (Bereich E) |
| 9 | `docs/content-source-audit.md` (Juli) als überholt kennzeichnen | Entwicklung nach Freigabe | nein |
| 10 | Offene redaktionelle Hinweise (Abschnitt 2.3) abarbeiten | Redaktion | ja, je Artikel |
