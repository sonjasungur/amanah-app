import type { KnowledgeEntry } from "./types";

const REVIEWED = "2026-07-01";

export const knowledgeEntriesDe: KnowledgeEntry[] = [
  {
    id: "kb-notfallmappe-allgemein",
    title: "Was gehört in eine Notfallmappe?",
    category: "notfallmappe",
    language: "de",
    summary:
      "Eine Notfallmappe bündelt wichtige Kontakte, Dokumenthinweise und Wünsche — zur Orientierung für Angehörige im Ernstfall.",
    content:
      "Eine Notfallmappe (AmanahOrdner) hilft Angehörigen, im Ernstfall schneller zu handeln. Typische Inhalte: Notfallkontakte, medizinische Hinweise, Vorsorgevollmacht/Patientenverfügung (Hinweise, nicht die Originale), Bestattungswünsche, Schuldenhinweise, digitaler Nachlass und ein Familienbrief. Der AmanahOrdner ersetzt keine Rechtsberatung und garantiert keine Vollständigkeit — fachliche Prüfung empfohlen.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Notfallmappe", "AmanahOrdner", "Vorbereitung", "Familie"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-notfallkontakte",
    title: "Notfallkontakte — wen zuerst informieren?",
    category: "notfallkontakte",
    language: "de",
    summary:
      "Benenne eine oder mehrere Vertrauenspersonen, die im Notfall zuerst informiert werden sollen.",
    content:
      "Notfallkontakte sind Personen, die im Krankheits- oder Todesfall zuerst erreicht werden sollen — z. B. Ehepartner, Geschwister oder eine Vertrauensperson. Notiere Name, Telefonnummer und Beziehung. Ergänze optional eine zweite Kontaktperson. Der AmanahOrdner speichert diese Angaben zur Vorbereitung; rechtliche Vertretung regelt separat eine Vorsorgevollmacht — bitte Anwalt/Notar oder Beratungsstelle konsultieren.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Notfallkontakt", "Vertrauensperson", "Telefon", "Familie"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-dokumentenuebersicht",
    title: "Dokumentenübersicht — welche Unterlagen sind wichtig?",
    category: "dokumentenuebersicht",
    language: "de",
    summary:
      "Eine Übersicht hilft Angehörigen, relevante Unterlagen zu finden — ohne Passwörter oder sensible Zugangsdaten zu speichern.",
    content:
      "Eine Dokumentenübersicht listet, wo wichtige Unterlagen aufbewahrt werden: z. B. Ausweis, Versicherungen, Vorsorgevollmacht, Patientenverfügung, Testament, Mietvertrag, Kontounterlagen. Im AmanahOrdner werden nur Hinweise dokumentiert — keine Passwörter. Originale und rechtliche Wirksamkeit müssen separat geprüft werden. Fachliche Prüfung durch Anwalt/Notar empfohlen.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Dokumente", "Übersicht", "Aufbewahrung", "Vorsorge"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-vorsorgevollmacht-allgemein",
    title: "Was ist eine Vorsorgevollmacht — allgemein?",
    category: "vorsorgevollmacht",
    language: "de",
    summary:
      "Eine Vorsorgevollmacht bestimmt, wer im Krankheitsfall für dich handeln darf — rechtliche Details bitte fachlich prüfen.",
    content:
      "Mit einer Vorsorgevollmacht kannst du eine Person benennen, die in deinem Namen handeln darf, wenn du es selbst nicht mehr kannst — z. B. bei Behörden, Banken oder Verträgen. Form, Umfang und Wirksamkeit hängen vom deutschen Recht ab. Der AmanahOrdner hilft, deine Wünsche zu dokumentieren — ersetzt keine Rechtsberatung. Bitte Anwalt, Notar oder Bundesjustizministerium (Orientierung) konsultieren.",
    sourceLabel: "Bundesjustizministerium — Orientierung",
    sourceUrl: "https://www.bmjv.de/DE/themen/familie_und_partnerschaft/vorsorgevollmacht/vorsorgevollmacht_node.html",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Vorsorgevollmacht", "Krankheit", "Vertretung", "Recht"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-patientenverfuegung-allgemein",
    title: "Was ist eine Patientenverfügung — allgemein?",
    category: "patientenverfuegung",
    language: "de",
    summary:
      "Eine Patientenverfügung dokumentiert medizinische Wünsche für den Fall, dass du nicht mehr entscheiden kannst.",
    content:
      "Eine Patientenverfügung legt fest, welche medizinischen Maßnahmen du wünschen oder ablehnen möchtest, wenn du nicht mehr entscheidungsfähig bist. Sie dient der Orientierung für Ärzte und Angehörige. Der AmanahOrdner hilft, Wünsche vorzubereiten — keine medizinische Beratung. Individuelle Entscheidungen bitte mit Arzt/Fachperson besprechen. Allgemeine Informationen: Bundesgesundheitsministerium.",
    sourceLabel: "Bundesgesundheitsministerium — Orientierung",
    sourceUrl: "https://www.bundesgesundheitsministerium.de/themen/pflege/patientenverfuegung.html",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Patientenverfügung", "Medizin", "Wünsche", "Vorsorge"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-bestattungswuensche-allgemein",
    title: "Bestattungswünsche — allgemeine Orientierung",
    category: "bestattungswuensche",
    language: "de",
    summary:
      "Bestattungswünsche helfen Angehörigen, deine Vorstellungen zu verstehen — ohne rechtliche Garantien.",
    content:
      "Bestattungswünsche können Form der Beisetzung, gewünschten Bestatter, islamische Grundsätze, Kostenrahmen und Hinweise für die Familie umfassen. In Deutschland gelten zusätzlich rechtliche und organisatorische Regeln. Dokumentiere Wünsche im AmanahOrdner zur Orientierung — fachliche Prüfung mit Bestatter, Imam/Gelehrten und ggf. Anwalt empfohlen.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Bestattung", "Janazah", "Wünsche", "Bestatter"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-janazah-begriffe",
    title: "Islamische Janazah-Begriffe — allgemein",
    category: "janazah-begriffe",
    language: "de",
    summary:
      "Janazah bezeichnet die islamische Bestattungszeremonie — Ghusl, Kafan, Gebet und Beisetzung.",
    content:
      "Janazah umfasst die Begleitung eines verstorbenen Muslims: rituelle Waschung (Ghusl), Leichentücher (Kafan), Janazah-Gebet (Salāt al-Janāzah) und Beisetzung. Details können je nach Meinung variieren. Der AmanahOrdner erklärt Begriffe nur allgemein — bei Detailfragen Imam/Gelehrte konsultieren, keine Fatwa.",
    sourceLabel: "Klassische Fiqh-Literatur — allgemeine Orientierung",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Janazah", "Bestattung", "Islam", "Begriffe"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-ghusl-kafan",
    title: "Was bedeuten Ghusl und Kafan?",
    category: "ghusl-kafan",
    language: "de",
    summary:
      "Ghusl ist die rituelle Waschung des Verstorbenen, Kafan die weißen Leichentücher — allgemeine Erklärung.",
    content:
      "Ghusl (Totenwaschung) ist die rituelle Reinigung des Verstorbenen nach islamischer Tradition. Kafan sind die weißen Tücher, in die der Verstorbene gehüllt wird. Wer wäscht und wie viele Tücher — das kann Meinungsunterschiede haben. Moschee, Bestatter oder Imam/Gelehrte können bei der praktischen Umsetzung helfen. Keine verbindliche religiöse Entscheidung durch die App.",
    sourceLabel: "Klassische Fiqh-Literatur — allgemeine Orientierung",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Ghusl", "Kafan", "Janazah", "Totenwaschung"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-sadaqa-jariya",
    title: "Was ist Sadaqa Jariya?",
    category: "sadaqa-jariya",
    language: "de",
    summary:
      "Sadaqa Jariya bezeichnet fortlaufende Wohltätigkeit, deren Nutzen auch nach dem Tod weiterwirkt — allgemeine Orientierung.",
    content:
      "Sadaqa Jariya (beständige Wohltätigkeit) kann z. B. Brunnen, Bildung, Moschee-Unterstützung oder andere Projekte umfassen, deren Nutzen anhält. Muslime planen manchmal Sadaqa Jariya als Teil ihrer Vorsorge. Der AmanahOrdner hilft, Wünsche zu dokumentieren — keine Fatwa und keine Garantie religiöser Bewertung. Detailfragen mit Imam/Gelehrten besprechen.",
    sourceLabel: "Hadith-Literatur — allgemeine Orientierung",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Sadaqa Jariya", "Wohltätigkeit", "Barzakh", "Spende"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-digitaler-nachlass",
    title: "Was ist digitaler Nachlass?",
    category: "digitaler-nachlass",
    language: "de",
    summary:
      "Digitaler Nachlass umfasst Hinweise zu Online-Konten und Geräten — ohne Passwörter in der App zu speichern.",
    content:
      "Digitaler Nachlass betrifft E-Mail, Social Media, Cloud, Abos und Geräte. Im AmanahOrdner werden nur Hinweise dokumentiert — keine Passwörter. Angehörige brauchen Orientierung, welche Konten existieren und was damit geschehen soll. Rechtliche Zugänge regeln gesonderte Vollmachten — Anwalt/Notar konsultieren.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Digitaler Nachlass", "Online", "Konten", "Hinweise"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-familiennachricht",
    title: "Familiennachricht und Vertrauensperson",
    category: "familiennachricht",
    language: "de",
    summary:
      "Ein Familienbrief oder eine Nachricht an Vertrauenspersonen erklärt deine wichtigsten Wünsche verständlich.",
    content:
      "Eine Familiennachricht oder ein Familienbrief kann Angehörige im schweren Moment orientieren: wer zuerst informiert werden soll, wichtige Wünsche zu Krankheit, Bestattung und Spiritualität. Der AmanahOrdner hilft beim Formulieren — Entwurf immer selbst prüfen lassen. Kein automatischer Versand, keine Rechtsberatung.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Familienbrief", "Vertrauensperson", "Nachricht", "Familie"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-app-grenzen",
    title: "Grenzen der App — fachliche Prüfung empfohlen",
    category: "app-grenzen",
    language: "de",
    summary:
      "AmanahOrdner dient der Orientierung und Vorbereitung — keine Rechts-, Medizin- oder Fatwa-Beratung.",
    content:
      "Der AmanahOrdner und Amanah-Assistent helfen beim Ordnen, Formulieren und Erkennen offener Punkte. Sie ersetzen keinen Imam/Gelehrten, Arzt, Anwalt oder Notar. Keine Garantie auf Vollständigkeit oder rechtliche Wirksamkeit. Bei individuellen Fragen: Recht — Anwalt/Notar; Medizin — Arzt/Fachperson; Religion — Imam/Gelehrte.",
    sourceLabel: "AmanahOrdner — Sicherheitshinweis",
    reviewedStatus: "reviewed",
    riskLevel: "low",
    tags: ["Disclaimer", "Grenzen", "Fachliche Prüfung", "Sicherheit"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-notfallmappe-checkliste",
    title: "Notfallmappe — einfache Checkliste",
    category: "notfallmappe",
    language: "de",
    summary: "Kurze Checkliste: Kontakte, medizinische Hinweise, Bestattung, Schulden, digitaler Nachlass.",
    content:
      "Checkliste zur Vorbereitung: (1) Notfallkontakte, (2) medizinische Hinweise/Patientenverfügung, (3) Vorsorgevollmacht-Hinweis, (4) Bestattungswünsche, (5) Schulden & Amanah, (6) digitaler Nachlass, (7) Familienbrief. Schrittweise ergänzen — fachliche Prüfung empfohlen.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "draft",
    riskLevel: "low",
    tags: ["Checkliste", "Notfallmappe", "Vorbereitung"],
    lastReviewedAt: REVIEWED,
  },
  {
    id: "kb-janazah-deutschland",
    title: "Janazah in Deutschland — praktische Hinweise",
    category: "janazah-begriffe",
    language: "de",
    summary: "Beisetzung in Deutschland oder Überführung — beides braucht Vorbereitung.",
    content:
      "In Deutschland können Muslime hier beerdigt oder ins Ausland überführt werden. Beides hat rechtliche Fristen, Kosten und familiäre Aspekte. Dokumentiere Wünsche frühzeitig. Moschee, Bestatter und Imam/Gelehrte können orientieren — keine verbindliche Rechts- oder Fatwa-Aussage.",
    sourceLabel: "AmanahOrdner — Orientierungshilfe",
    reviewedStatus: "needs_review",
    riskLevel: "medium",
    tags: ["Janazah", "Deutschland", "Überführung", "Bestattung"],
  },
];

export function getAllEntries(): KnowledgeEntry[] {
  return [...knowledgeEntriesDe];
}

export function getProductionEntries(): KnowledgeEntry[] {
  return getAllEntries().filter(
    (e) => e.reviewedStatus === "reviewed" || (e.reviewedStatus === "draft" && e.riskLevel === "low")
  );
}

export function getReviewedEntries(): KnowledgeEntry[] {
  return getAllEntries().filter((e) => e.reviewedStatus === "reviewed");
}

export function getEntriesNeedingReview(): KnowledgeEntry[] {
  return getAllEntries().filter((e) => e.reviewedStatus === "needs_review" || e.reviewedStatus === "draft");
}

export function getEntryById(id: string): KnowledgeEntry | undefined {
  return getAllEntries().find((e) => e.id === id);
}

export const FAQ_ENTRY_IDS = [
  "kb-notfallmappe-allgemein",
  "kb-vorsorgevollmacht-allgemein",
  "kb-ghusl-kafan",
  "kb-sadaqa-jariya",
  "kb-digitaler-nachlass",
] as const;

export function getFaqEntries(): KnowledgeEntry[] {
  return FAQ_ENTRY_IDS.map((id) => getEntryById(id)).filter(Boolean) as KnowledgeEntry[];
}
