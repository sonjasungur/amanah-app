import type { WissenFilter, WissenMeta } from "@/lib/types";

export const WISSEN_FILTER_LABELS: Record<WissenFilter, string> = {
  islam: "Islamische Vorbereitung",
  recht: "Rechtliche Vorsorge DE",
  familie: "Familie & Kommunikation",
  digital: "Digitaler Nachlass",
  finanzen: "Finanzen & Schulden",
  konvertierte: "Für Konvertierte",
  unverheiratete: "Für Unverheiratete",
  "erste-schritte": "Erste Schritte",
};

export const WISSEN_META: Record<string, WissenMeta> = {
  "w-janazah": { filters: ["islam", "erste-schritte"], urgency: "hoch", audience: ["Alle Muslime", "Eltern"], shortAnswer: "Janazah-Wünsche schriftlich festhalten — sonst entscheidet die Familie unter Schock." },
  "w-ghusl": { filters: ["islam"], urgency: "hoch", audience: ["Alle Muslime"], shortAnswer: "Ghusl und Kafan vorab mit Moschee/Bestatter klären." },
  "w-bestattung": { filters: ["islam", "recht"], urgency: "hoch", audience: ["Alle in DE"], shortAnswer: "Beisetzung DE vs. Überführung — rechtlich und finanziell planen." },
  "w-pv": { filters: ["recht", "erste-schritte"], urgency: "hoch", audience: ["Alle Erwachsenen"], shortAnswer: "Patientenverfügung schriftlich — sonst entscheidet das Krankenhaus." },
  "w-vollmacht": { filters: ["recht", "erste-schritte"], urgency: "hoch", audience: ["Alle Erwachsenen"], shortAnswer: "Vollmacht für Krankheit — wer darf unterschreiben?" },
  "w-betreuung": { filters: ["recht"], urgency: "mittel", audience: ["Alle Erwachsenen"], shortAnswer: "Betreuungsverfügung — Wunschperson fürs Gericht." },
  "w-testament": { filters: ["islam", "recht", "finanzen"], urgency: "hoch", audience: ["Vermögende", "Eltern"], shortAnswer: "Islamisches Erbe + deutsches Recht — fachlich abstimmen." },
  "w-schulden": { filters: ["islam", "finanzen"], urgency: "hoch", audience: ["Alle Muslime"], shortAnswer: "Schulden und Amanah listen — vor Erbe tilgen." },
  "w-digital": { filters: ["digital", "erste-schritte"], urgency: "mittel", audience: ["Alle"], shortAnswer: "Konten und Zugänge dokumentieren — keine Passwörter im Klartext." },
  "w-sadaqa": { filters: ["islam"], urgency: "spaeter", audience: ["Alle Muslime"], shortAnswer: "Sadaqa Jariya bewusst planen statt teurer Trauerfeiern." },
  "w-familie": { filters: ["familie", "konvertierte", "erste-schritte"], urgency: "hoch", audience: ["Alle", "Konvertierte"], shortAnswer: "Vor dem Notfall sprechen — Brief ergänzt Dokumente." },
  "w-notfall": { filters: ["erste-schritte"], urgency: "hoch", audience: ["Alle"], shortAnswer: "Notfallkarte mit Kontakt und Hinweisen — sofort griffbereit." },
};

export const URGENCY_STYLES = {
  hoch: "bg-accent/15 text-accent border-accent/30",
  mittel: "bg-warning/15 text-warning border-warning/30",
  spaeter: "bg-muted/10 text-muted border-primary/10",
} as const;
