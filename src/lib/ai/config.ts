import type { AiProviderName } from "./types";

export function isAiEnabled(): boolean {
  const v = process.env.AMANAH_AI_ENABLED ?? process.env.AI_ENABLED;
  if (v === "false" || v === "0") return false;
  return true;
}

export function getAiProviderName(): AiProviderName {
  const name = (process.env.AMANAH_AI_PROVIDER || process.env.AI_PROVIDER || "rules").toLowerCase();
  if (name === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (name === "mock") return "mock";
  if (name === "openai") return "rules";
  return "rules";
}

export function requiresExternalAiConsent(): boolean {
  return getAiProviderName() === "openai";
}

export function getAiModelFast(): string {
  return process.env.AMANAH_AI_MODEL_FAST || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getAiModelSmart(): string {
  return process.env.AMANAH_AI_MODEL_SMART || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || undefined;
}

export const AI_CONSENT_STORAGE_KEY = "amanah-ai-consent";

export type AiConsentStatus = "granted" | "denied" | "pending";

export function isExternalProviderActive(): boolean {
  return getAiProviderName() === "openai";
}
