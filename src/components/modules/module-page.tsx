"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import type { AmanahOrdnerData } from "@/lib/types";
import { ModuleForm, type FieldConfig } from "@/components/modules/module-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";

interface ModulePageProps {
  title: string;
  description: string;
  section: keyof AmanahOrdnerData;
  fields: FieldConfig[];
  disclaimerType?: "main" | "islamic" | "legal";
  children?: React.ReactNode;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path];
  const [first, ...rest] = path.split(".");
  const nested = obj[first] as Record<string, unknown>;
  return getNestedValue(nested, rest.join("."));
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  if (!path.includes(".")) return { ...obj, [path]: value };
  const [first, ...rest] = path.split(".");
  return {
    ...obj,
    [first]: setNestedValue((obj[first] as Record<string, unknown>) || {}, rest.join("."), value),
  };
}

export function ModulePage({ title, description, section, fields, disclaimerType = "main", children }: ModulePageProps) {
  const store = useAmanahStore();
  const values = store[section] as unknown as Record<string, unknown>;

  const flatValues: Record<string, unknown> = {};
  for (const field of fields) {
    flatValues[field.key] = getNestedValue(values, field.key);
  }

  const handleChange = (field: string, value: unknown) => {
    const updated = setNestedValue(values, field, value);
    store.updateField(section, updated as never);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">{title}</h1>
      <p className="text-muted mb-6">{description}</p>
      <Disclaimer type={disclaimerType} className="mb-6" />
      <Card>
        <CardTitle>Deine Angaben</CardTitle>
        <ModuleForm section={section} fields={fields} values={flatValues} onChange={handleChange} />
      </Card>
      {children}
    </div>
  );
}
