# Prüfpaket Religion

**Prüfer:** qualifizierte islamische Gelehrte; das Prüfmodell und die Abdeckung der vier sunnitischen Rechtsschulen sind vorläufig (Doku 10). Die Auswahl trifft der Owner. **Sperre:** `religion`; Artikel, Hadith, Qur'an und Erbquoten bleiben gesperrt.

Der Wissensbereich soll dauerhaft kostenlos als Sadaqa Jariyah zugänglich sein, aber nur mit geprüften Inhalten.

## Zu prüfen

| Thema | Unterlagen |
|---|---|
| 10 Startartikel und Prüfliste | `docs/review-packages/` (`ik-start-*`, `PRUEFLISTE-GELEHRTE.md`, `QUELLENUEBERSICHT.md`) |
| Regelwerk der Modellrechnung, Erbquoten | `docs/review-packages/REGELWERK-MODELLRECHNUNG.md` |
| Hadith-Wortlaute, Referenzen, Einstufungen | Doku 40 §3 |
| Weitere Einträge | `kb-janazah-begriffe`, `kb-ghusl-kafan`, `kb-sadaqa-jariya`, `kb-bestattungswuensche-allgemein`, `kb-janazah-deutschland` in `src/lib/knowledge/entries.ts` |
| Gesperrte Modultexte, Grenzfälle | `docs/release/gesperrte-modultexte.md` |
| Sichtbare religiöse Begriffe | Startseite Akhira, `/akuter-todesfall`, `/konvertierte`, Vorsorge-Check `src/lib/check/` |

## Offene Fragen

1. Welche Rechtsschulen und Meinungsunterschiede sollen die Artikel abbilden?
2. Sind die sinngemäßen Hadith-Wiedergaben zutreffend, und welche Einstufung gilt? Herkunft der vorhandenen Einstufungen ist ungeklärt.
3. Wer zeichnet je Artikel und Version?
4. Sind die Begriffe auf den sichtbaren Seiten in dieser Form vertretbar, auch die Worterklärung zu Akhira?
5. Prüfung je Sprache: Eine Übersetzung gilt nicht als geprüft (`docs/release/sprachabdeckung.md`).

## Prüfstand der Quellen

Automatisierte Abgleiche der Referenzen in Doku 05 und 09, keine Gelehrtenprüfung; sunnah.com war automatisch nicht abrufbar. **Nichts ist religiös freigegeben.**
