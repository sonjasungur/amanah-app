"use client";

import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
  testId?: string;
  showWhenProfileBirthDateEmpty?: boolean;
  helpText?: string;
}

interface ModuleFormProps {
  section: string;
  fields: FieldConfig[];
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export function ModuleForm({ fields, values, onChange }: ModuleFormProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.key} data-testid={field.testId}>
          <Label>{field.label}</Label>
          {field.helpText && <p className="text-xs text-muted mb-1.5">{field.helpText}</p>}
          {field.type === "textarea" && (
            <Textarea
              value={(values[field.key] as string) || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
          {field.type === "text" && (
            <Input
              value={(values[field.key] as string) || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
          {field.type === "number" && (
            <Input
              type="number"
              min={0}
              value={(values[field.key] as number) || 0}
              onChange={(e) => onChange(field.key, parseInt(e.target.value) || 0)}
            />
          )}
          {field.type === "select" && (
            <Select value={(values[field.key] as string) || ""} onChange={(e) => onChange(field.key, e.target.value)}>
              <option value="">{t("common.pleaseSelect")}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          )}
          {field.type === "boolean" && (
            <Select
              value={values[field.key] === null ? "" : values[field.key] ? "yes" : "no"}
              onChange={(e) => onChange(field.key, e.target.value === "" ? null : e.target.value === "yes")}
            >
              <option value="">{t("common.pleaseSelect")}</option>
              <option value="yes">{t("common.yes")}</option>
              <option value="no">{t("common.no")}</option>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}
