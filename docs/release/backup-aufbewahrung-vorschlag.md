# Vorschlag: Backup-Fristen und Altbestand (Stand 03.11.2026)

**Für:** Owner und Datenschutzprüfung. **Vorschlag, keine rechtliche Bewertung und nichts umgesetzt.** Bis zur Entscheidung wird nichts gelöscht; es läuft keine automatische Löschung.

## Fristen für neue Backups

| Stufe | Behalten | Wofür |
|---|---|---|
| täglich | 14 Tage | Fehler, die schnell auffallen |
| wöchentlich (Sonntag) | 8 Wochen | spät bemerkte Fehler |
| monatlich (1. des Monats) | 6 Monate | seltene Fälle |

**Längste Frist: 180 Tage.** Das ergibt rund 30 Dateien; Platz ist heute kein Thema (rund 4 KB je Backup), wächst aber mit echten Konten.

**Warum nicht länger:** Gelöschte Konten bleiben bis zum Fristablauf in Backups. Kontodaten wie E-Mail stehen dort unverschlüsselt im Dump, nur die Ordnerinhalte sind zusätzlich verschlüsselt, und das Ganze ist mit `age` verschlüsselt. Je kürzer, desto schneller wirkt eine Löschung auch dort.

**Warum nicht kürzer:** Unter einem Monat fallen schleichende Fehler womöglich erst auf, wenn es keine gute Kopie mehr gibt.

**Was daran hängt:**

- `AMANAH_BACKUP_MAX_RETENTION_DAYS=180`: Das Löschprotokoll hält dann 187 Tage (Doku 39 §5). Der Wert muss auch Archivkopien abdecken.
- Datenschutzhinweis: Löschung in Backups spätestens nach 180 Tagen nennen.
- **Eine zweite Kopie außerhalb des Servers gibt es nicht.** Fällt der Server aus, sind alle Backups weg. Eigene Entscheidung; sie würde dieselben Fristen brauchen.
- Umsetzung nach Entscheidung: Löschskript, das nur Dateien nach diesem Plan entfernt und die jüngste Datei immer behält; zuerst als Trockenlauf.

## Altbestand

`altbestand-klartext-20261103.tar.gz.age` enthält 126 frühere Dumps, nur noch verschlüsselt. Der Dump `amanah_amanah_20260705_145211` enthält 2 Kontozeilen. Inhalt nicht gelesen und hier nicht wiedergegeben; ob es Testkonten waren, ist nicht bekannt. Die Produktion hat heute 0 Konten.

**Bekannt:** Die Dumps lagen bis 03.11. unverschlüsselt auf dem Server, für lokale Nutzer lesbar, unter keinem öffentlichen Pfad; kein Hinweis auf Abruf durch Dritte. Fehlende Zugriffsprotokolle schließen das nicht aus.

**Vorschlag in dieser Reihenfolge:**

1. Owner prüft `check-old` (Doku 45 §2.2), damit das Archiv nachweislich lesbar ist.
2. Owner stellt lokal fest, ob die 2 Zeilen Testkonten sind. Die Datei nicht an Agenten geben.
3. **Testkonten:** Archiv löschen, sobald ein geprüftes neues Backup existiert. Es gibt keinen erkennbaren Zweck für die Aufbewahrung.
4. **Echte Personen:** Datenschutzprüfung entscheidet vor dem Löschen, auch ob die frühere Lesbarkeit weiter zu bewerten ist; danach ebenfalls löschen.
5. Ergebnis ohne personenbezogene Angaben dokumentieren.

Bis dahin: nichts löschen. Auch die drei Prüfkopien vom 03.11. (0 Konten) bleiben, bis die Frist entschieden ist.

**Die Datei wird nur als Ganzes gelöscht**; einzelne Dumps herauszulösen bräuchte Entschlüsselung und ist nicht nötig, wenn der ganze Altbestand keinen Zweck mehr hat.
