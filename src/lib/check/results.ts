import { CHECK_QUESTIONS, type CheckQuestion } from "./questions";

export type CheckAnswers = Record<string, boolean>;

export interface CheckGap {
  label: string;
  modulePath?: string;
  urgent: boolean;
}

const PREP_QUESTIONS = CHECK_QUESTIONS.filter((q) => q.category !== "profil");

export interface CheckResult {
  yesCount: number;
  total: number;
  prepYesCount: number;
  prepTotal: number;
  status: "green" | "yellow" | "red";
  statusLabel: string;
  missing: CheckGap[];
  prepared: string[];
  personalizedHints: string[];
  nextSteps: { label: string; href: string; priority: number }[];
  profile: {
    isConvert: boolean;
    familyMuslim: boolean;
    married: boolean;
    hasTrustPerson: boolean;
    familyKnowsIslam: boolean;
  };
}

function isGap(q: CheckQuestion, answer: boolean | undefined): boolean {
  if (answer === undefined) return false;
  if (q.yesIsGood === true) return !answer;
  return !answer;
}

export function computeCheckResult(answers: CheckAnswers): CheckResult {
  const missing: CheckGap[] = [];
  const prepared: string[] = [];
  let yesCount = 0;
  let prepYesCount = 0;

  for (const q of CHECK_QUESTIONS) {
    const a = answers[q.id];
    if (a === true) yesCount++;
    if (q.category !== "profil" && a === true) prepYesCount++;
    if (isGap(q, a)) {
      missing.push({ label: q.label, modulePath: q.modulePath, urgent: q.urgent });
    } else if (a === true) {
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
  }

  if (!profile.married && !profile.hasTrustPerson) {
    personalizedHints.push(
      "Du solltest dringend einen muslimischen Notfallkontakt und eine Vertrauensperson hinterlegen."
    );
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
    status === "green" ? "Solide Grundlage" : status === "yellow" ? "Teilweise vorbereitet" : "Dringend ordnen";

  const nextSteps: CheckResult["nextSteps"] = [];
  if (missing.some((m) => m.label.includes("Notfall"))) {
    nextSteps.push({ label: "Notfallkarte zuerst erstellen", href: "/dashboard/notfallkarte", priority: 1 });
  }
  if (profile.isConvert && !profile.familyMuslim) {
    nextSteps.push({ label: "Brief für nicht-muslimische Familie", href: "/dashboard/familie", priority: 2 });
  }
  nextSteps.push({ label: "Geführt meinen Ordner ausfüllen", href: "/dashboard/ausfuellen", priority: 3 });
  nextSteps.push({ label: "Konvertierten-Checkliste ansehen", href: "/konvertierte", priority: 4 });

  return {
    yesCount,
    total: CHECK_QUESTIONS.length,
    prepYesCount,
    prepTotal,
    status,
    statusLabel,
    missing,
    prepared,
    personalizedHints,
    nextSteps: nextSteps.sort((a, b) => a.priority - b.priority),
    profile,
  };
}

/** Rule-based next steps (works without AI) */
export function getRuleBasedNextSteps(result: CheckResult): string[] {
  const steps: string[] = [];
  if (result.missing[0]) {
    steps.push(`Als Erstes: ${result.missing[0].label} — im Ordner ergänzen.`);
  }
  if (result.personalizedHints[0]) {
    steps.push(result.personalizedHints[0]);
  }
  steps.push("Export/PDF sichern und Vertrauensperson informieren, wo der Ordner liegt.");
  return steps.slice(0, 3);
}
