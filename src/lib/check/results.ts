import { CHECK_QUESTIONS, type CheckQuestion } from "./questions";

export type CheckAnswers = Record<string, boolean>;

export interface CheckGap {
  id: string;
  label: string;
  modulePath?: string;
  urgent: boolean;
}

export interface CheckPrimaryRecommendation {
  id: string;
  label: string;
  href: string;
  reason: string;
}

const CONTEXT_QUESTION_IDS = new Set(["convert", "family-muslim", "married"]);

const TASK_PRIORITY: Record<string, number> = {
  "notfall-contact": 1,
  "trust-muslim": 2,
  vollmacht: 3,
  janazah: 4,
  patientenverfuegung: 5,
  burial: 6,
  bestatter: 7,
  "family-knows-islam": 8,
  schulden: 9,
  testament: 10,
  digital: 11,
  sadaqa: 12,
};

const PREP_QUESTIONS = CHECK_QUESTIONS.filter((q) => !CONTEXT_QUESTION_IDS.has(q.id));

export interface CheckResult {
  yesCount: number;
  total: number;
  prepYesCount: number;
  prepTotal: number;
  status: "green" | "yellow" | "red";
  statusLabel: string;
  missing: CheckGap[];
  visibleTasks: CheckGap[];
  furtherTasks: CheckGap[];
  prepared: string[];
  personalizedHints: string[];
  primaryRecommendation: CheckPrimaryRecommendation;
  nextSteps: { label: string; href: string; priority: number }[];
  profile: {
    isConvert: boolean;
    familyMuslim: boolean;
    married: boolean;
    hasTrustPerson: boolean;
    familyKnowsIslam: boolean;
  };
}

export function isContextProfileQuestion(question: CheckQuestion | Pick<CheckQuestion, "id">): boolean {
  return CONTEXT_QUESTION_IDS.has(question.id);
}

function isGap(q: CheckQuestion, answer: boolean | undefined): boolean {
  if (answer === undefined) return false;
  if (isContextProfileQuestion(q)) return false;
  if (q.yesIsGood === true) return !answer;
  return !answer;
}

function sortGaps(gaps: CheckGap[]): CheckGap[] {
  return [...gaps].sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return (TASK_PRIORITY[a.id] ?? 99) - (TASK_PRIORITY[b.id] ?? 99);
  });
}

export function pickPrimaryRecommendation(answers: CheckAnswers): CheckPrimaryRecommendation {
  if (answers["notfall-contact"] === false) {
    return {
      id: "notfallkarte",
      label: "Notfallkarte",
      href: "/dashboard/notfallkarte",
      reason: "Es fehlen Notfallkontakte bzw. eine klare Entscheidungsbefugnis.",
    };
  }
  if (answers["trust-muslim"] === false || answers.vollmacht === false) {
    return {
      id: "vollmacht",
      label: "Vorsorgevollmacht",
      href: "/dashboard/vollmacht",
      reason: "Es ist noch nicht geklärt, wer als Vertrauensperson für dich handeln darf.",
    };
  }
  if (answers.janazah === false) {
    return {
      id: "janazah",
      label: "Janazah-Wünsche",
      href: "/dashboard/janazah",
      reason: "Janazah-Wünsche sind noch nicht dokumentiert.",
    };
  }
  return {
    id: "plan",
    label: "Persönlicher Vorsorgeplan",
    href: "/dashboard",
    reason: "Kein akuter kritischer Punkt — im persönlichen Vorsorgeplan fortfahren.",
  };
}

export function computeCheckResult(answers: CheckAnswers): CheckResult {
  const missing: CheckGap[] = [];
  const prepared: string[] = [];
  let yesCount = 0;
  let prepYesCount = 0;

  for (const q of CHECK_QUESTIONS) {
    const a = answers[q.id];
    if (a === true) yesCount++;
    if (!isContextProfileQuestion(q) && a === true) prepYesCount++;
    if (isGap(q, a)) {
      missing.push({ id: q.id, label: q.label, modulePath: q.modulePath, urgent: q.urgent });
    } else if (a === true && !isContextProfileQuestion(q)) {
      prepared.push(q.label);
    }
  }

  const profile = {
    isConvert: answers.convert === true,
    familyMuslim: answers["family-muslim"] === true,
    married: answers.married === true,
    hasTrustPerson: answers["trust-muslim"] === true,
    familyKnowsIslam: answers["family-knows-islam"] === true,
  };

  const personalizedHints: string[] = [];

  if (profile.isConvert && !profile.familyMuslim) {
    personalizedHints.push(
      "Bereite einen kurzen Brief für deine nicht-muslimische Familie vor — in einfachem Deutsch, ohne Fachbegriffe."
    );
    personalizedHints.push(
      "Erkläre Ghusl, Kafan und Janazah-Gebet so, dass Nicht-Muslime handeln können, ohne gegen deine Wünsche zu verstoßen."
    );
  } else if (profile.isConvert) {
    personalizedHints.push("Als Konvertit·in kann eine kurze schriftliche Erklärung deiner Wünsche die Familie entlasten.");
  }

  if (!profile.hasTrustPerson) {
    personalizedHints.push(
      "Kläre mit einer Moschee, einem Imam oder einem islamischen Bestatter, wer im Todesfall kontaktiert wird."
    );
  }

  if (!profile.familyKnowsIslam) {
    personalizedHints.push(
      "Deine Angehörigen wissen vermutlich nicht, was islamisch prioritär ist — dokumentiere es schriftlich."
    );
  }

  const prepTotal = PREP_QUESTIONS.length;
  const prepPercent = prepTotal > 0 ? Math.round((prepYesCount / prepTotal) * 100) : 0;
  const status = prepPercent >= 70 ? "green" : prepPercent >= 40 ? "yellow" : "red";
  const statusLabel =
    status === "green" ? "Solide Grundlage" : status === "yellow" ? "Teilweise vorbereitet" : "Noch wenig vorbereitet";

  const sortedMissing = sortGaps(missing);
  const visibleTasks = sortedMissing.slice(0, 3);
  const furtherTasks = sortedMissing.slice(3);
  const primaryRecommendation = pickPrimaryRecommendation(answers);

  return {
    yesCount,
    total: CHECK_QUESTIONS.length,
    prepYesCount,
    prepTotal,
    status,
    statusLabel,
    missing: sortedMissing,
    visibleTasks,
    furtherTasks,
    prepared,
    personalizedHints,
    primaryRecommendation,
    nextSteps: [
      {
        label: "Diesen Schritt jetzt erledigen",
        href: primaryRecommendation.href,
        priority: 1,
      },
    ],
    profile,
  };
}

/** Rule-based next steps (works without AI) */
export function getRuleBasedNextSteps(result: CheckResult): string[] {
  const steps = result.visibleTasks.map((task) =>
    task.urgent ? `${task.label} — zuerst klären.` : `${task.label} — im Vorsorgeplan ergänzen.`
  );
  if (steps.length === 0) {
    steps.push("Im persönlichen Vorsorgeplan fortfahren und Angaben aktuell halten.");
  }
  return steps.slice(0, 3);
}
