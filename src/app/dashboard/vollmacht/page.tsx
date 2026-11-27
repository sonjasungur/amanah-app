"use client";

import { moduleText } from "@/lib/content/module-texts";
import { Disclaimer } from "@/components/ui/disclaimer";
import { HelpTip } from "@/components/ui/help-tip";
import { SaveBar } from "@/components/storage/save-bar";
import { PoaWishesEditor } from "@/components/vorsorge/poa-wishes-editor";

/** AP22 EA-07: wishes for a power of attorney, structured; no effective power of attorney. */
export default function VollmachtPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2 flex flex-wrap items-center">
        Vorsorgevollmacht
        <HelpTip topic="vorsorgevollmacht" />
      </h1>
      <p className="text-muted mb-6">{moduleText("vollmacht-intro")}</p>
      <Disclaimer type="legal" className="mb-6" />
      <PoaWishesEditor />
      <SaveBar />
    </div>
  );
}
