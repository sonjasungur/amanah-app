"use client";

import { moduleText } from "@/lib/content/module-texts";
import { Disclaimer } from "@/components/ui/disclaimer";
import { RelatedKnowledge } from "@/components/islamic-knowledge/related-knowledge";
import { DebtsEditor } from "@/components/vorsorge/debts-editor";
import { HelpTip } from "@/components/ui/help-tip";

export default function SchuldenAmanahPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2 flex flex-wrap items-center">Schulden &amp; Amanah <HelpTip topic="schulden-amanah" /></h1>
      <p className="text-muted mb-6">
        {moduleText("schulden-intro")}
      </p>
      <Disclaimer className="mb-6" />
      <RelatedKnowledge
        topics={[
          { area: "faraid", subtopicId: "schulden" },
          { area: "vorsorge", subtopicId: "schulden-dokumentieren" },
        ]}
      />

      <DebtsEditor />
    </div>
  );
}
