"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { ModuleForm, type FieldConfig } from "@/components/modules/module-form";

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, part) => (cur && typeof cur === "object" ? (cur as Record<string, unknown>)[part] : undefined), obj);
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const [first, ...rest] = path.split(".");
  if (rest.length === 0) return { ...obj, [first]: value };
  return { ...obj, [first]: setNested((obj[first] as Record<string, unknown>) ?? {}, rest.join("."), value) };
}

/** Some fields of one folder section, bound to the store exactly like on the section's own page. */
export function SectionFields({ section, fields }: { section: keyof AmanahOrdnerData; fields: FieldConfig[] }) {
  const values = useAmanahStore((s) => s[section]) as unknown as Record<string, unknown>;
  const updateField = useAmanahStore((s) => s.updateField);
  const flat = Object.fromEntries(fields.map((f) => [f.key, getNested(values, f.key)]));
  return (
    <ModuleForm
      section={section}
      fields={fields}
      values={flat}
      onChange={(key, value) => {
        // Read the newest section: two quick changes must not overwrite each other.
        const latest = useAmanahStore.getState()[section] as unknown as Record<string, unknown>;
        updateField(section, setNested(latest, key, value) as never);
      }}
    />
  );
}
