"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const questions = [
  "Hast du eine Patientenverfügung?",
  "Hast du eine Vorsorgevollmacht?",
  "Weiß deine Familie, wer im Notfall entscheiden darf?",
  "Hast du deine Janazah-Wünsche dokumentiert?",
  "Weiß deine Familie, ob du in Deutschland beerdigt oder überführt werden möchtest?",
  "Hast du einen islamischen Bestatter/Moschee-Kontakt notiert?",
  "Hast du Schulden, geliehene Dinge und Amanah aufgeschrieben?",
  "Hast du Testament und islamisches Erbe geprüft?",
  "Weißt du, was du über Waṣiyya bis maximal ein Drittel bestimmen darfst?",
  "Hast du Sadaqa Jariya und Barzakh-Vorbereitung geregelt?",
];

export function AmanahCheck() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (yes: boolean) => {
    const newAnswers = [...answers];
    newAnswers[step] = yes;
    setAnswers(newAnswers);
    if (step < 9) setStep(step + 1);
    else setDone(true);
  };

  if (done) {
    const yesCount = answers.filter((a) => a === true).length;
    const status = yesCount >= 7 ? "green" : yesCount >= 4 ? "yellow" : "red";
    const labels = { green: "Gut vorbereitet", yellow: "Teilweise vorbereitet", red: "Dringend vorbereiten" };
    const colors = { green: "text-success bg-success/10", yellow: "text-warning bg-warning/10", red: "text-danger bg-danger/10" };

    return (
      <Card className="max-w-lg mx-auto text-center">
        <div className={`inline-block rounded-full px-6 py-2 text-lg font-bold mb-4 ${colors[status]}`}>
          {labels[status]}
        </div>
        <p className="text-muted mb-2">{yesCount} von 10 Fragen mit Ja beantwortet</p>
        <p className="text-sm mb-6">
          {status === "red" && "Es gibt wichtige Bereiche, die du noch vorbereiten solltest."}
          {status === "yellow" && "Du bist auf einem guten Weg, aber einige Punkte fehlen noch."}
          {status === "green" && "Gut gemacht! Halte deine Dokumente aktuell und prüfe regelmäßig."}
        </p>
        <Link href="/dashboard"><Button size="lg">AmanahOrdner erstellen</Button></Link>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <div className="flex justify-between text-sm text-muted mb-4">
        <span>Frage {step + 1} von 10</span>
        <span>{Math.round(((step) / 10) * 100)}%</span>
      </div>
      <div className="h-2 bg-sand rounded-full mb-6">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(step / 10) * 100}%` }} />
      </div>
      <h2 className="text-xl font-semibold text-primary mb-6">{questions[step]}</h2>
      <div className="flex gap-4">
        <Button className="flex-1" onClick={() => handleAnswer(true)}>Ja</Button>
        <Button className="flex-1" variant="outline" onClick={() => handleAnswer(false)}>Nein</Button>
      </div>
    </Card>
  );
}
