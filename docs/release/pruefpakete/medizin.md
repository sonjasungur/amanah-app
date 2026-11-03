# Prüfpaket Medizin

**Prüfer:** Ärztin oder Arzt mit Erfahrung in Palliativmedizin oder Vorsorgeberatung; bei Bedarf Medizinrecht. **Sperre:** `medizin`.

## Zu prüfen

| Thema | Unterlagen |
|---|---|
| Artikel zur Patientenverfügung, gesperrt | `src/lib/knowledge/patientenverfuegung.ts` (`pv-what`, `pv-muslim`, `pv-religious`, `pv-vollmacht`) |
| Eintrag `kb-patientenverfuegung-allgemein`, gesperrt | `src/lib/knowledge/entries.ts` |
| Felder und Fragen zu medizinischen Wünschen | `/dashboard/krankheit`, `src/lib/modules/fields.ts`, Notfallkarte |
| Angaben im Notfall, Ausdruck | `/dashboard/notfallkarte`, `src/components/print/print-views.tsx` |

## Offene Fragen

1. Dürfen die Texte in dieser Form als allgemeine Information erscheinen?
2. Können Felder der Notfallkarte im Ernstfall missverstanden werden, etwa als ärztliche Anordnung?
3. Reicht der Hinweis, dass die Plattform keine ärztliche Beratung ersetzt?

## Prüfstand

Die Durchsicht der Module fand keine eigenständigen medizinischen Aussagen; das ist eine Stichwort- und Textprüfung, keine fachliche Bewertung. Keine medizinische Prüfung liegt vor.
