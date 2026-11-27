# P2.5-C: Ablage erzeugter PDFs und hochgeladener Unterlagen – Prüfung und Empfehlung

Stand 18.11.2026. Entscheidungsvorlage für die Betreiberin. Nichts davon ist umgesetzt: Amanah speichert weiterhin **keine** erzeugten PDFs und nimmt **keine** Datei-Uploads an.

## Ist-Zustand (P2.5)

- **Erzeugung:** Ausdrucke entstehen bei jedem Aufruf neu im Browser aus dem verschlüsselten Ordner. „Als PDF speichern“ nutzt den Druckdialog des Geräts. Auf dem Server entsteht dabei keine Datei, und es gibt keinen Netzaufruf (Test `p25-folder.test.tsx`, P2-Abnahme).
- **Ordner:** Der Ordner (JSON) liegt umschlagverschlüsselt in der Datenbank: AES-256-GCM, ein Schlüssel je Datensatz, an den Eigentümer gebunden. Versionen gibt es nur über die bestehende, standardmäßig abgeschaltete Historie.
- **„Meine Dokumente“ zeigt:**
  - Ordnerstatus
  - offene Aufgaben
  - Originale mit Ablageort, nur als Text
  - Ausdrucke mit dem Datum der letzten Änderung der zugrunde liegenden Angaben

## Geprüfte Optionen

| Kriterium | A: Keine Dateien (heute) | B: Erzeugte PDFs verschlüsselt speichern | C: Uploads von Originalen (Scans) |
|---|---|---|---|
| Nutzen | Ausdruck ist immer aktuell | Alter Ausdruck nachweisbar („was hatte ich damals gedruckt?“) | Familie findet Scans im Ernstfall |
| Aufbewahrung | Entfällt | Frist festzulegen (z. B. letzte 3 Fassungen je Dokument); muss zur Ordner-Historie passen | Unbefristet bis Löschung; Erbfall braucht eigene Regel |
| Verschlüsselung | Ordner wie heute | Gleiches Umschlagverfahren nötig; Dateien sind groß, daher Streaming-Verschlüsselung oder Blob-Tabelle | Wie B, dazu Prüfung auf Schadsoftware |
| Löschen | Entfällt | Mit Konto, einzeln, nach Frist; Backups 30 Tage nachlaufend | Wie B; Löschnachweis gegenüber Angehörigen |
| Versionen | Entfällt (Daten-Historie optional) | Je Erzeugung eine Fassung | Je Upload |
| Zugriff | Nur Konto-Inhaber | Nur Inhaber; ein späterer Angehörigenzugang bräuchte eigene Rechte | Wie B; besonders sensibel (Ausweis, Gesundheit) |
| Datenschutz | Minimal | Gesundheitsdaten in Dateien (Art. 9 DSGVO), daher DSFA nötig | Ausweiskopien und Gesundheitsdaten; DSFA zwingend, AV-Verträge |
| Technik | Vorhanden | Datenbankmigration, Größenlimits, Backupvolumen | Migration, Objektspeicher, Virenscan, Upload-Grenzen |
| Kosten | 0 € | Speicher und Backup wachsen; bei ca. 300 KB je PDF gering, aber Backup-Laufzeit steigt | Objektspeicher plus Scan-Dienst; laufende Kosten. Nach Regel nur mit Freigabe |
| Risiko | Ausdruck kann veralten, wenn er im Schrank liegt | Veraltete Fassungen werden für aktuell gehalten | Höchstes Schadenspotenzial bei einem Leck |

## Empfehlung

1. **Option A beibehalten.** Keine Ablage erzeugter PDFs und keine Uploads in P2.5 und P3.
2. **Später, ohne Migration:** Im Ordner-JSON nur festhalten, *wann* ein Dokument zuletzt gedruckt wurde (`vorsorgeMeta.printedAt`), ohne Inhalt. Dann kann „Meine Dokumente“ sagen: „Notfallkarte zuletzt gedruckt am …, seitdem geändert – bitte neu drucken.“
   - Vorher klären: Konten ohne Plus dürfen heute nur bestimmte Meta-Felder schreiben (`freeVorsorgeMeta`). Das Feld müsste dort freigegeben werden. Das ist eine Tarifentscheidung.
3. **Option C** nur nach DSFA, AV-Verträgen, Virenscan-Konzept, Kostenfreigabe und eigener Migrationsfreigabe. Vorher kein Code.
4. **Option B** nicht empfehlenswert: Sie vermischt den „lebenden“ Ordner mit veralteten Kopien.

## Offene Entscheidungen für die Betreiberin

- Druckdatum ohne Inhalt speichern (Punkt 2): ja oder nein; wenn ja, auch für kostenlose Konten?
- Soll es Uploads von Originalen langfristig geben (Option C)? Wenn ja: Budget, DSFA, Anbieter.
