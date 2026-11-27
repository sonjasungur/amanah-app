"use client";

import { useId } from "react";
import { DateInput, Input, Textarea, Label, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";
import { HelpTip } from "@/components/ui/help-tip";
import type { HelpTopicId } from "@/lib/content/help-topics";
import { FieldHelp } from "@/components/help/field-help";
import type { FieldHelpId } from "@/lib/help/types";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "number" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
  testId?: string;
  showWhenProfileBirthDateEmpty?: boolean;
  /** Merged legacy field: shown only while it holds a value that differs from this other field (AP22 EA-12.2). */
  showWhenLegacyDiffers?: string;
  helpText?: string;
  /** A "?" with a short explanation next to the label. */
  help?: HelpTopicId;
  /** AP22 EA-01.3: the ⓘ help module (term, guidance, views, room, decision, sources, review status). Replaces `help`. */
  fieldHelp?: FieldHelpId;
}

interface ModuleFormProps {
  section: string;
  fields: FieldConfig[];
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export function ModuleForm({ section, fields, values, onChange }: ModuleFormProps) {
  const { t } = useI18n();
  const formId = useId();
  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const id = `${formId}-${field.key}`;
        const control = { id, "aria-describedby": field.helpText ? `${id}-help` : undefined };
        return (
        <div key={field.key} data-testid={field.testId}>
          <div className="flex flex-wrap items-center">
            <Label htmlFor={id}>{field.label}</Label>
            {field.fieldHelp ? <FieldHelp id={field.fieldHelp} label={field.label} /> : field.help && <HelpTip topic={field.help} />}
          </div>
          {field.helpText && <p id={`${id}-help`} className="text-xs text-muted mb-1.5">{field.helpText}</p>}
          {field.type === "textarea" && (
            <Textarea
              {...control}
              value={(values[field.key] as string) || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
          {field.type === "text" && (
            <Input
              {...control}
              value={(values[field.key] as string) || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
          {field.type === "date" && (
            <DateInput
              id={id}
              describedBy={control["aria-describedby"]}
              value={(values[field.key] as string) || ""}
              onValueChange={(v) => onChange(field.key, v)}
              draftKey={`${section}.${field.key}`}
              path={`${section}.${field.key}`}
              label={field.label}
              birth={field.key === "birthDate"}
              testId={field.testId ? `${field.testId}-input` : undefined}
            />
          )}
          {field.type === "number" && (
            <Input
              {...control}
              type="number"
              min={0}
              value={(values[field.key] as number) || 0}
              onChange={(e) => onChange(field.key, parseInt(e.target.value) || 0)}
            />
          )}
          {field.type === "select" && (
            <Select {...control} value={(values[field.key] as string) || ""} onChange={(e) => onChange(field.key, e.target.value)}>
              <option value="">{t("common.pleaseSelect")}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          )}
          {field.type === "boolean" && (
            <Select
              {...control}
              value={values[field.key] === null ? "" : values[field.key] ? "yes" : "no"}
              onChange={(e) => onChange(field.key, e.target.value === "" ? null : e.target.value === "yes")}
            >
              <option value="">{t("common.pleaseSelect")}</option>
              <option value="yes">{t("common.yes")}</option>
              <option value="no">{t("common.no")}</option>
            </Select>
          )}
        </div>
        );
      })}
    </div>
  );
}
