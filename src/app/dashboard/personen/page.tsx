"use client";

import { PeopleEditor } from "@/components/vorsorge/people-editor";

/** One list of people, reused by emergency card, powers of attorney, Janazah and the testament preparation. */
export default function PersonenPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary mb-2">Familie &amp; Kontakte</h1>
        <p className="text-muted max-w-2xl">
          Trage jede Person nur einmal ein. Auf Notfallkarte, Vollmacht und Janazah-Wünschen wählst du sie dann aus.
          Hier wird nichts an andere Personen geschickt oder freigegeben.
        </p>
      </header>
      <PeopleEditor />
    </div>
  );
}
