import type { KnowledgeArticleRecord, SchoolDifference } from "../types";

/**
 * The ten starter articles of docs/strategy/10-redaktionsplan.md as drafts for review.
 *
 * Rules for these drafts:
 * - Statements only where a cited, technically verified source says so (Qurʾān verbatim
 *   QuranEnc 1.1.4; hadith numbers verified 2026-10-30, renderings marked as own paraphrase).
 * - No partial verbatim verse quotes in the body (QuranEnc terms: no deletion); the full
 *   verse is shown with the sources.
 * - Everything else is an editorial marker "[Redaktion: …]" / "[Juristische Prüfung: …]",
 *   which blocks publication (workflow.ts).
 * - School differences are open questions without positions until a scholar adds sourced
 *   positions — also blocks publication.
 * - No reviewer, no review date, status DRAFT.
 */
const CREATED = "Entwurf 2026-10-30 (Claude Code, nicht fachlich geprüft)";

function openQuestion(question: string): SchoolDifference {
  return { question, kind: "difference", positions: [] };
}

function draft(
  record: Omit<KnowledgeArticleRecord, "status" | "version" | "reviews" | "relatedSlugs" | "editorialNotes"> & {
    editorialNotes?: string[];
  }
): KnowledgeArticleRecord {
  return {
    ...record,
    status: "DRAFT",
    version: 1,
    reviews: [],
    relatedSlugs: [],
    editorialNotes: [CREATED, ...(record.editorialNotes ?? [])],
  };
}

export const START_ARTICLE_DRAFTS: KnowledgeArticleRecord[] = [
  draft({
    id: "ik-start-01-faraid-grundlagen",
    slug: "islamisches-erbrecht-grundlagen",
    area: "faraid",
    subtopicId: "grundlagen",
    title: "Islamisches Erbrecht: Grundlagen und Reihenfolge",
    summary: "Was mit dem Nachlass geschieht, bevor er unter den Erben verteilt wird.",
    body: [
      "Der Qurʾān legt in Sure an-Nisāʾ (4:11 und 4:12) Erbanteile für Kinder, Eltern und Ehepartner fest. Beide Verse sagen ausdrücklich, dass diese Anteile erst nach Abzug eines etwaigen Vermächtnisses oder einer Schuld gelten (vollständiger Wortlaut bei den Quellen).",
      "Der Prophet hat offene Schulden sehr ernst genommen: Für einen Verstorbenen mit unbeglichenen Schulden verrichtete er das Totengebet zunächst nicht selbst, bis ein Gefährte die Schuld übernahm (Bukhari 2289, sinngemäß).",
      "[Redaktion: Reihenfolge Bestattungskosten – Schulden – Waṣiyya – Erbteilung mit Belegen und Positionen der Rechtsschulen ergänzen.]",
      "[Redaktion: Hinweis auf Bereich E – deutsches Recht gilt grundsätzlich unabhängig davon; Verweis auf Artikel zum Vergleich.]",
    ].join("\n\n"),
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12", "hadith-debts-deceased"],
    schoolDifferences: [
      openQuestion("Haben Bestattungskosten Vorrang vor Schulden?"),
      openQuestion("Gelten offene Zakāt- oder Kaffāra-Pflichten als Nachlassschulden?"),
    ],
    requiresLegalReview: false,
  }),
  draft({
    id: "ik-start-02-quran-verse",
    slug: "quran-4-11-4-12-4-176-erklaert",
    area: "faraid",
    subtopicId: "quran-4-11-12-176",
    title: "Qurʾān 4:11, 4:12 und 4:176 verständlich erklärt",
    summary: "Die drei Verse, in denen der Qurʾān Erbanteile festlegt – Wort für Wort und in einfacher Sprache.",
    body: [
      "4:11 behandelt Kinder und Eltern: Einem Sohn kommt so viel zu wie der Anteil von zwei Töchtern. Sind es nur Töchter, mehr als zwei, stehen ihnen zwei Drittel zu, bei einer Tochter die Hälfte. Jeder Elternteil erhält ein Sechstel, wenn Kinder vorhanden sind; ohne Kinder erhält die Mutter ein Drittel, bei Brüdern ein Sechstel.",
      "4:12 behandelt Ehepartner und Halbgeschwister mütterlicherseits: Der Ehemann erhält die Hälfte, mit Kindern ein Viertel; die Ehefrau ein Viertel, mit Kindern ein Achtel. Bei Erbfolge ohne Eltern und Kinder erhalten Halbgeschwister mütterlicherseits je ein Sechstel, mehrere teilen sich ein Drittel.",
      "4:176 behandelt die seitliche Verwandtschaft (Kalāla): Eine Schwester erhält die Hälfte, zwei Schwestern zwei Drittel; bei Brüdern und Schwestern erhält ein Bruder so viel wie zwei Schwestern.",
      "Alle Anteile gelten nach Abzug eines Vermächtnisses und von Schulden. Der vollständige Wortlaut steht bei den Quellen.",
      "[Redaktion: Fachlich prüfen, ob die Zusammenfassung die Verse korrekt wiedergibt; „zwei Töchter“ (Wortlaut: „mehr als zwei“) erläutern.]",
    ].join("\n\n"),
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12", "quran-nisa-4-176"],
    schoolDifferences: [
      openQuestion("Erhalten genau zwei Töchter ebenfalls zwei Drittel?"),
      openQuestion("Wer zählt als Kalāla?"),
    ],
    requiresLegalReview: false,
  }),
  draft({
    id: "ik-start-03-rechenbeispiele",
    slug: "erbanteile-rechenbeispiele",
    area: "faraid",
    subtopicId: "rechenbeispiele",
    title: "Erbanteile von Ehepartnern, Kindern und Eltern – mit Rechenbeispielen",
    summary: "Wie sich die Anteile in typischen Familienkonstellationen zusammensetzen.",
    body: [
      "Beispiel 1 – Ehefrau, ein Sohn, eine Tochter: Die Ehefrau erhält wegen der Kinder ein Achtel (4:12). Der Rest (7/8) wird so geteilt, dass der Sohn das Doppelte der Tochter erhält (4:11): Sohn 7/12, Tochter 7/24.",
      "Beispiel 2 – Ehefrau, zwei Töchter, Vater, Mutter: Feste Anteile 1/8 + 2/3 + 1/6 + 1/6 ergeben mehr als das Ganze (27/24). Die Anteile werden dann anteilig gekürzt: Ehefrau 3/27, Töchter 16/27, Vater und Mutter je 4/27.",
      "[Redaktion: Beleg für die Verteilung des Rests (ʿaṣaba) und für die anteilige Kürzung (ʿawl) ergänzen – beides ist nicht unmittelbar im Wortlaut der Verse enthalten.]",
      "[Redaktion: Die Beispiele stammen aus den Testfällen des gesperrten Rechen-Prototyps (src/lib/inheritance); Rechenregeln vor Veröffentlichung von Gelehrten abnehmen lassen.]",
    ].join("\n\n"),
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12"],
    schoolDifferences: [
      openQuestion("Radd: Erhalten Ehepartner einen verbleibenden Rest?"),
      openQuestion("ʿUmariyyatān: Wie viel erhält die Mutter neben Ehegatte und Vater?"),
      openQuestion("Großvater neben Geschwistern"),
    ],
    requiresLegalReview: false,
    editorialNotes: ["Keine individuelle Erbberechnung anbieten; Beispiele bleiben illustrativ."],
  }),
  draft({
    id: "ik-start-04-wasiyya",
    slug: "wasiyya-ein-drittel",
    area: "faraid",
    subtopicId: "wasiyya-drittel",
    title: "Waṣiyya und die Ein-Drittel-Regel",
    summary: "Wie viel man frei vermachen kann – und warum es ratsam ist, das Vermächtnis schriftlich festzuhalten.",
    body: [
      "Saʿd ibn Abī Waqqāṣ wollte einen großen Teil seines Vermögens vermachen. Der Prophet erlaubte ein Drittel und sagte: „Ein Drittel, und ein Drittel ist viel.“ (Bukhari 2742, 2744; Muslim 1628, sinngemäß)",
      "Nach einer weiteren Überlieferung soll ein Muslim, der etwas zu vermachen hat, keine zwei Nächte verbringen, ohne dass sein Testament schriftlich bei ihm liegt (Bukhari 2738, sinngemäß).",
      "[Redaktion: Vermächtnis an gesetzliche Erben und Zustimmung der Erben über ein Drittel hinaus – mit verifizierter Fundstelle und Gradierung (z. B. Abū Dāwūd 2870 / at-Tirmidhī 2120) und Schulpositionen ergänzen.]",
    ].join("\n\n"),
    sourceIds: ["hadith-wasiyyah-third", "hadith-wasiyyah-saad", "hadith-wasiyya-written"],
    schoolDifferences: [
      openQuestion("Ist ein Vermächtnis an einen gesetzlichen Erben mit Zustimmung der übrigen Erben gültig?"),
      openQuestion("Was gilt, wenn ein Vermächtnis ein Drittel übersteigt?"),
    ],
    germanLawNote:
      "[Juristische Prüfung: Nach deutschem Recht begrenzt nicht das Drittel, sondern der Pflichtteil (§§ 2303 ff. BGB) die Testierfreiheit; ein eigenhändiges Testament muss vollständig handschriftlich sein (§ 2247 BGB). Text durch Rechtsanwalt prüfen.]",
    requiresLegalReview: true,
  }),
  draft({
    id: "ik-start-05-schulden",
    slug: "schulden-des-verstorbenen",
    area: "faraid",
    subtopicId: "schulden",
    title: "Schulden des Verstorbenen",
    summary: "Warum offene Schulden vor der Erbteilung beglichen werden und was Angehörige wissen sollten.",
    body: [
      "Die Erbanteile in 4:11 und 4:12 gelten jeweils erst nach Begleichung einer Schuld.",
      "Als ein Verstorbener mit drei Dinar Schulden und ohne Nachlass gebracht wurde, verrichtete der Prophet das Totengebet zunächst nicht selbst und sagte: „Betet für euren Gefährten.“ Erst als Abu Qatada die Schuld übernahm, betete er für ihn (Bukhari 2289, sinngemäß).",
      "[Redaktion: Praktische Hinweise zur Dokumentation von Schulden (Verweis auf das Modul „Schulden & Amanah“) und Schulpositionen ergänzen.]",
    ].join("\n\n"),
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12", "hadith-debts-deceased"],
    schoolDifferences: [openQuestion("Müssen Erben Schulden über den Nachlass hinaus begleichen?")],
    germanLawNote:
      "[Juristische Prüfung: Erbenhaftung für Nachlassverbindlichkeiten (§ 1967 BGB), Ausschlagung (§ 1944 BGB: sechs Wochen) und Haftungsbeschränkung erläutern und prüfen lassen.]",
    requiresLegalReview: true,
  }),
  draft({
    id: "ik-start-06-nach-dem-tod",
    slug: "erste-stunden-nach-dem-tod",
    area: "tod-sterben",
    subtopicId: "nach-dem-tod",
    title: "Die ersten Stunden nach dem Tod",
    summary: "Was Angehörige islamisch tun sollten – und was nicht belegt ist.",
    body: [
      "Der Qurʾān erinnert daran, dass jede Seele den Tod kosten wird (3:185; vollständiger Wortlaut bei den Quellen).",
      "Der Prophet forderte dazu auf, die Janāza zu beschleunigen (Bukhari 1315; Muslim 944, sinngemäß).",
      "[Redaktion: Belegte Handlungen unmittelbar nach dem Tod (z. B. Schließen der Augen, Bittgebet) mit verifizierten Fundstellen ergänzen; verbreitete, nicht belegte Praktiken getrennt kennzeichnen.]",
    ].join("\n\n"),
    sourceIds: ["quran-al-imran-3-185", "hadith-janazah-hasten"],
    schoolDifferences: [],
    requiresLegalReview: false,
    editorialNotes: ["Deutsche Abläufe (Leichenschau, Totenschein) gehören in Bereich E, nicht in diesen Artikel."],
  }),
  draft({
    id: "ik-start-07-ghusl",
    slug: "ghusl-des-verstorbenen",
    area: "janazah",
    subtopicId: "ghusl",
    title: "Ghusl des Verstorbenen",
    summary: "Die rituelle Waschung: wer sie vornimmt und wie sie überliefert ist.",
    body: [
      "Umm ʿAṭiyya berichtet, dass der Prophet bei der Waschung seiner verstorbenen Tochter anwies, sie mit Wasser und Sidr zu waschen und zuletzt Kampfer zu verwenden (Bukhari 1254, sinngemäß).",
      "[Redaktion: Ablauf, Anzahl der Waschungen, wer waschen darf (gleiches Geschlecht, Ehepartner) mit Belegen und Schulpositionen ergänzen.]",
    ].join("\n\n"),
    sourceIds: ["hadith-ghusl-umm-atiyya"],
    schoolDifferences: [
      openQuestion("Darf der Ehepartner den Verstorbenen waschen?"),
      openQuestion("Wie viele Waschungen sind verpflichtend, wie viele empfohlen?"),
    ],
    requiresLegalReview: false,
  }),
  draft({
    id: "ik-start-08-kafan-janazah",
    slug: "kafan-und-janazah-gebet",
    area: "janazah",
    subtopicId: "salat-al-janazah",
    title: "Kafan und Salāt al-Janāza",
    summary: "Leichentücher, das Totengebet und die Belohnung für die Begleitung.",
    body: [
      "ʿĀʾischa berichtet, dass der Prophet in drei weiße Tücher gehüllt wurde (Bukhari 1273, sinngemäß).",
      "Wer bei der Janāza anwesend ist, bis das Gebet verrichtet wurde, erhält ein Qīrāṭ; wer bis zur Beerdigung bleibt, zwei – „wie zwei gewaltige Berge“ (Bukhari 1325, sinngemäß).",
      "Der Prophet forderte dazu auf, die Janāza zu beschleunigen (Bukhari 1315; Muslim 944, sinngemäß).",
      "[Redaktion: Ablauf des Janāza-Gebets, Kafan für Frauen und Männer mit Belegen und Schulpositionen ergänzen.]",
    ].join("\n\n"),
    sourceIds: ["hadith-kafan-three-white", "hadith-janazah-qirat", "hadith-janazah-hasten"],
    schoolDifferences: [
      openQuestion("Wird im Janāza-Gebet die Fātiḥa rezitiert?"),
      openQuestion("Ist ein Totengebet in Abwesenheit (ṣalāt al-ghāʾib) zulässig?"),
      openQuestion("Wie viele Tücher sind für Frauen vorgesehen?"),
    ],
    requiresLegalReview: false,
  }),
  draft({
    id: "ik-start-09-bestattung-deutschland",
    slug: "islamische-bestattung-in-deutschland",
    area: "islam-und-recht",
    subtopicId: "bestattung-deutschland",
    title: "Islamische Bestattung in Deutschland",
    summary: "Wo islamische Wünsche und deutsches Bestattungsrecht zusammenkommen.",
    body: [
      "Der Prophet forderte dazu auf, die Janāza zu beschleunigen (Bukhari 1315; Muslim 944, sinngemäß).",
      "[Redaktion: Abwägung Überführung ins Herkunftsland vs. zeitnahe Beisetzung mit Schulpositionen ergänzen.]",
    ].join("\n\n"),
    sourceIds: ["hadith-janazah-hasten"],
    schoolDifferences: [openQuestion("Ist eine Überführung, die die Beisetzung verzögert, zulässig?")],
    germanLawNote:
      "[Juristische Prüfung: Bestattungsrecht ist Landesrecht – Sargpflicht bzw. Ausnahmen, Mindestfristen, Grabfelder, Überführungsdokumente je Bundesland mit Normzitaten aufbereiten.]",
    requiresLegalReview: true,
  }),
  draft({
    id: "ik-start-10-sadaqa-jariya",
    slug: "sadaqa-jariya-und-vermaechtnisse",
    area: "vorsorge",
    subtopicId: "sadaqa-jariya",
    title: "Sadaqa Jāriya und wohltätige Vermächtnisse",
    summary: "Gutes, das über den Tod hinaus wirkt – und wie man es vorbereitet.",
    body: [
      "Wenn der Mensch stirbt, enden seine Taten außer drei: fortlaufende Sadaqa, nützliches Wissen und ein rechtschaffenes Kind, das für ihn bittet (Muslim 1631, sinngemäß).",
      "Ein Vermächtnis ist auf ein Drittel begrenzt (Bukhari 2742; Muslim 1628, sinngemäß).",
      "[Redaktion: Formen der Sadaqa Jāriya (z. B. Waqf) als Erläuterung kennzeichnen, nicht als Hadith-Inhalt; keine Empfehlung bestimmter Organisationen.]",
    ].join("\n\n"),
    sourceIds: ["hadith-sadaqa-jariya", "hadith-wasiyyah-third"],
    schoolDifferences: [openQuestion("Welche Formen des Waqf sind zulässig?")],
    germanLawNote:
      "[Juristische Prüfung: Vermächtnis an gemeinnützige Körperschaften (Erbschaftsteuerbefreiung § 13 Abs. 1 Nr. 16 ErbStG) und Stiftungsrecht durch Steuerberatung/Anwalt prüfen.]",
    requiresLegalReview: true,
  }),
];
