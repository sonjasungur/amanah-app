"use client";

import { ModulePage } from "@/components/modules/module-page";
import { janazahFields } from "@/lib/modules/fields";

export default function JanazahPage() {
  return (
    <ModulePage
      title="Janazah-Wünsche"
      description="Halte deine islamischen Bestattungswünsche fest — damit deine Familie im schwersten Moment weiß, was zu tun ist."
      section="janazahWishes"
      fields={janazahFields}
      disclaimerType="islamic"
    />
  );
}
