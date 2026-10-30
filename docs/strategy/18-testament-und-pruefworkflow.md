# Testamentsvorbereitung, Erbquoten-Engine und juristischer Prüfworkflow

Stand: 2026-10-30 · alles technisch umgesetzt und getestet · **alles gesperrt bzw. Sandbox**

## 1. Testamentsvorbereitung (`/dashboard/testament/vorbereitung`)

- Gesperrt, solange `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION` nicht `true` ist (Standard). Freischaltung: REQUIRES_LEGAL_REVIEW (RDG, Smartlaw-Abgrenzung) + REQUIRES_OWNER.
- Fragebogen: eine Frage pro Schritt, Fortschritt, Autosave, irrelevante Schritte werden übersprungen; Familie aus Erbprofil und Personenliste.
- Ergebnis in fünf getrennten Teilen: (1) persönliche Wünsche, (2) islamische Modellinformation, (3) Angaben für das deutsche Recht, (4) Fragen an Anwalt/Notar, (5) rechtlich freigegebene Dokumente = keine.
- Fragen an Anwalt/Notar werden deterministisch aus den Antworten erzeugt (`src/lib/testament/lawyer-questions.ts`) und sind **Fragen**, keine Antworten; Normverweise zeigen das Thema.
- Ausgabe trägt „Gesprächsunterlage – kein Testament“ und den § 2247-Hinweis.

## 2. Erbquoten-Engine (`src/lib/inheritance`)

- Exakte Brüche; Regelwerk `sunni-nuclear-family@0.1.0`, Status `unreviewed_draft`; Sonderfälle gesperrt.
- Anzeige nur, wenn Flag an **und** Regelwerk `scholar_reviewed` – derzeit für jede Kombination unmöglich (getestet).
- Zuordnung aus dem Fragebogen meldet fehlende Angaben (Vater, Mutter, Großeltern, Enkel über verstorbenen Sohn, Geschwister, Religion) statt zu raten.
- Tests: 27 (Lehrbuchfälle inkl. ʿawl 27/13, Sperrfälle, Eigenschaftstest: alle berechneten Fälle im Umfang ergeben exakt 1).
- Offen: REQUIRES_SCHOLAR_REVIEW für Regeln, Schulumfang und Rechenbeispiele.

## 3. Juristischer Prüfworkflow (Sandbox, `src/lib/legal-review/workflow.ts`)

```
Entwurf → (Freigabe durch Nutzer, 60 Tage) übermittelt → von Kanzlei angenommen
→ in Prüfung ⇄ Rückfrage → Rückmeldung → abgeschlossen      (Zurückziehen jederzeit)
```

- Amanah ist nur Softwareanbieter; das Mandat entsteht direkt zwischen Nutzer und Kanzlei.
- Kanzlei sieht nur zugewiesene Fälle, nur mit gültiger, nicht widerrufener Freigabe und nur in aktiven Zuständen; keine globale Liste.
- Jede Aktion und jeder verweigerte Zugriff wird protokolliert; Antworten erzeugen eine neue Dokumentversion.
- Nach Abschluss/Rückzug: Löschfrist für die Kanzleikopie (30 Tage, Wert vertraglich festzulegen).
- Kein Zustand bedeutet „rechtsgültig“ (getestet).
- Interne Demo mit synthetischen Daten: `/intern/pruefworkflow` (nur mit internen Werkzeugen; in Produktion 404).
- Nicht umgesetzt: Persistenz in der DB, Kanzleikonten/-rollen, verschlüsselte Übermittlung, Vergütung – setzt Kooperationsvertrag, AVV/Verantwortlichkeit und Prüfung nach § 49b BRAO voraus (REQUIRES_OWNER, REQUIRES_LEGAL_REVIEW).
