# Prüfpaket Datenschutz

**Prüfer:** Datenschutzberatung oder Datenschutzbeauftragte mit Erfahrung bei Art. 9 DSGVO; bei Bedarf Fachanwalt für IT-Recht. **Sperre:** `datenschutz`; `AMANAH_DATA_HISTORY` und `AMANAH_DELETION_LEDGER` bleiben aus.

## Zu prüfen

| Thema | Unterlagen im Repo |
|---|---|
| Datenschutzerklärung, Betreiberangaben | `src/app/datenschutz/page.tsx`, `src/lib/legal/imprint.ts` |
| Einwilligung Art. 9 Abs. 2 lit. a, Text als Entwurf gekennzeichnet | `src/lib/consent/purposes.ts`, `src/components/dashboard/consent-gate.tsx`, Doku 16 |
| Speicherung, Verschlüsselung, Backups | Doku 15, Doku 45 |
| Änderungshistorie, Fristen 90 Tage, 50 Versionen, 5 MiB | Doku 38 |
| Löschprotokoll, pseudonyme Daten nach einer Löschung | Doku 39 §2, §8 |
| Export, Löschung, Altkonten | Doku 16, 19, 38 |
| Auftragsverarbeiter: Hoster, Mail, Zahlung | Doku 21 |

## Offene Fragen

1. Reicht die Einwilligung für Angaben zu Dritten (Familie, Vertrauenspersonen), oder ist eine weitere Grundlage nötig?
2. Ist eine Datenschutz-Folgenabschätzung erforderlich?
3. Darf das Löschprotokoll Pseudonyme über die Löschung hinaus aufbewahren, und wie ist das zu erklären?
4. Welche Backup-Frist ist angemessen? Heute gibt es **keine automatische Löschung** verschlüsselter Backups in der Produktion.
5. Wie ist mit dem verschlüsselten Altbestand zu verfahren? Ein Dump vom 05.07.2026 enthält 2 Kontozeilen; der Inhalt wurde nicht gelesen, ein Zusammenhang mit echten Personen ist nicht geklärt.
6. Ist der frühere Zugang über den Host-Kopf bis zum 02.11.2026 bewertungsbedürftig (Doku 41 §1)? Heute 0 Konten; ob jemand zugegriffen hat, ist nicht feststellbar.
7. Welche Aufbewahrungsfrist gilt für Kaufdaten nach Kontolöschung?

## Vorhandene Prüfstände

Keine externe Prüfung. Die technischen Tests belegen Verhalten, keine Rechtmäßigkeit.
