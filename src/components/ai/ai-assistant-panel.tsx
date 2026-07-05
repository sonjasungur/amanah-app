"use client";

import { useState, useEffect } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { getAiConsent } from "@/lib/ai/consent-client";
import { useI18n } from "@/lib/i18n/context";
import { AiConsentBanner } from "@/components/ai/ai-consent-banner";
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card";
import { AiKnowledgeResult } from "@/components/ai/ai-knowledge-result";
import type { KnowledgeCitation } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea, Select } from "@/components/ui/input";
import type { ExtractSuggestion, FamilyMessageTone } from "@/lib/ai/types";
import { Bot, HelpCircle, ListChecks, MessageSquare, PenLine } from "lucide-react";

export function AiAssistantPanel() {
  const store = useAmanahStore();
  const { t } = useI18n();
  const [requiresExternal, setRequiresExternal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<string | null>(null);
  const [review, setReview] = useState<{ critical: { label: string }[]; recommended: { label: string }[]; summary: string } | null>(null);
  const [freeText, setFreeText] = useState("");
  const [suggestions, setSuggestions] = useState<ExtractSuggestion[]>([]);
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [familyMessage, setFamilyMessage] = useState("");
  const [tone, setTone] = useState<FamilyMessageTone>("liebevoll");
  const [knowledgeQ, setKnowledgeQ] = useState("");
  const [knowledgeA, setKnowledgeA] = useState("");
  const [knowledgeMeta, setKnowledgeMeta] = useState<{
    blocked?: boolean;
    noSource?: boolean;
    citations?: KnowledgeCitation[];
    suggestedNextStep?: string;
  } | null>(null);
  const [consentGranted, setConsentGranted] = useState(() => getAiConsent() === "granted");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((s) => {
        if (!cancelled) setRequiresExternal(s.requiresExternalConsent === true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const postAi = async (path: string, extra: Record<string, unknown> = {}) => {
    const data = pickDataFields(store);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, consentGranted, ...extra }),
    });
    const json = await res.json();
    if (json.requiresConsent) throw new Error("consent");
    if (!res.ok) throw new Error(json.error || "Fehler");
    return json;
  };

  const runNextQuestion = async () => {
    setLoading("next");
    try {
      const r = await postAi("/api/ai/next-question");
      setNextQuestion(`${r.question}\n\n(${r.reason})`);
    } catch {
      setNextQuestion(t("ai.error.generic"));
    }
    setLoading(null);
  };

  const runReview = async () => {
    setLoading("review");
    try {
      const r = await postAi("/api/ai/completion-review");
      setReview(r);
    } catch {
      setReview(null);
    }
    setLoading(null);
  };

  const runExtract = async () => {
    if (!freeText.trim()) return;
    setLoading("extract");
    try {
      const r = await postAi("/api/ai/extract", { freeText });
      setSuggestions(r.suggestedUpdates || []);
      setClarifications(r.clarificationNeeded || []);
    } catch {
      setSuggestions([]);
    }
    setLoading(null);
  };

  const applySuggestions = (items: ExtractSuggestion[]) => {
    for (const s of items) {
      const parts = s.fieldPath.split(".");
      if (
        parts[0] === "emergencyCard" &&
        parts[1] === "emergencyContact1" &&
        parts[2]
      ) {
        store.updateField("emergencyCard", {
          ...store.emergencyCard,
          emergencyContact1: {
            ...store.emergencyCard.emergencyContact1,
            [parts[2]]: String(s.value),
          },
        });
      } else if (parts.length === 2) {
        store.updateNested(parts[0], parts[1], s.value);
      }
    }
    setSuggestions([]);
    setClarifications([]);
    setFreeText("");
  };

  const runFamilyMessage = async () => {
    setLoading("family");
    try {
      const r = await postAi("/api/ai/family-message", { tone });
      setFamilyMessage(r.message);
    } catch {
      setFamilyMessage("");
    }
    setLoading(null);
  };

  const runKnowledge = async (question?: string) => {
    const q = (question ?? knowledgeQ).trim();
    if (!q) return;
    setKnowledgeQ(q);
    setLoading("knowledge");
    try {
      const r = await postAi("/api/ai/knowledge", { question: q });
      if (r.blocked) {
        setKnowledgeA(r.message || r.answer);
        setKnowledgeMeta({ blocked: true, citations: [] });
      } else {
        setKnowledgeA(r.answer);
        setKnowledgeMeta({
          blocked: false,
          noSource: r.noSource,
          citations: r.citations,
          suggestedNextStep: r.suggestedNextStep,
        });
      }
    } catch {
      setKnowledgeA(t("ai.error.generic"));
      setKnowledgeMeta(null);
    }
    setLoading(null);
  };

  const faqQuestions = [
    t("knowledge.faq.notfallmappe"),
    t("knowledge.faq.vorsorgevollmacht"),
    t("knowledge.faq.ghuslKafan"),
    t("knowledge.faq.sadaqaJariya"),
    t("knowledge.faq.digitalerNachlass"),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <Bot size={28} /> {t("ai.title")}
        </h1>
        <p className="text-muted text-sm">{t("ai.subtitle")}</p>
      </div>

      <AiConsentBanner
        requiresExternal={requiresExternal}
        onConsentChange={(g) => setConsentGranted(g)}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle size={18} /> {t("ai.nextQuestion")}
          </CardTitle>
          <p className="text-xs text-muted mt-2 mb-3">{t("ai.nextQuestionHint")}</p>
          <Button size="sm" onClick={runNextQuestion} disabled={!!loading}>
            {loading === "next" ? "…" : t("ai.nextQuestionBtn")}
          </Button>
          {nextQuestion && (
            <p className="text-sm mt-3 p-3 bg-sand rounded-xl whitespace-pre-wrap">{nextQuestion}</p>
          )}
        </Card>

        <Card>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={18} /> {t("ai.reviewMap")}
          </CardTitle>
          <p className="text-xs text-muted mt-2 mb-3">{t("ai.reviewHint")}</p>
          <Button size="sm" variant="outline" onClick={runReview} disabled={!!loading}>
            {loading === "review" ? "…" : t("ai.reviewBtn")}
          </Button>
          {review && (
            <div className="text-sm mt-3 space-y-2">
              <p>{review.summary}</p>
              {review.critical.map((c) => (
                <p key={c.label} className="text-warning">• {c.label}</p>
              ))}
              {review.recommended.slice(0, 3).map((c) => (
                <p key={c.label} className="text-muted">• {c.label}</p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine size={18} /> {t("ai.freeText")}
        </CardTitle>
        <Textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder={t("ai.freeTextPlaceholder")}
          className="mt-3 min-h-[80px]"
        />
        <Button size="sm" className="mt-2" onClick={runExtract} disabled={!!loading || !freeText.trim()}>
          {loading === "extract" ? "…" : t("ai.analyzeBtn")}
        </Button>
        <AiSuggestionCard
          suggestions={suggestions}
          clarificationNeeded={clarifications}
          previewNote={t("ai.previewNote")}
          onApply={applySuggestions}
          onDismiss={() => { setSuggestions([]); setClarifications([]); }}
          applyLabel={t("ai.applySuggestions")}
        />
      </Card>

      <Card>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare size={18} /> {t("ai.familyMessage")}
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-3 items-center">
          <Select value={tone} onChange={(e) => setTone(e.target.value as FamilyMessageTone)}>
            <option value="liebevoll">Liebevoll</option>
            <option value="sachlich">Sachlich</option>
            <option value="kurz">Kurz</option>
            <option value="ausfuehrlich">Ausführlich</option>
          </Select>
          <Button size="sm" variant="outline" onClick={runFamilyMessage} disabled={!!loading}>
            {loading === "family" ? "…" : t("ai.familyMessageBtn")}
          </Button>
        </div>
        {familyMessage && (
          <Textarea readOnly value={familyMessage} className="mt-3 min-h-[120px] text-sm" />
        )}
      </Card>

      <Card>
        <CardTitle className="text-base">{t("ai.knowledge")}</CardTitle>
        <p className="text-xs text-muted mt-1">{t("knowledge.basis")}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {faqQuestions.map((q) => (
            <Button key={q} size="sm" variant="outline" onClick={() => runKnowledge(q)} disabled={!!loading}>
              {q}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            className="flex-1 rounded-xl border border-primary/20 px-3 py-2 text-sm"
            value={knowledgeQ}
            onChange={(e) => setKnowledgeQ(e.target.value)}
            placeholder={t("ai.knowledgePlaceholder")}
          />
          <Button size="sm" onClick={() => runKnowledge()} disabled={!!loading}>
            {loading === "knowledge" ? "…" : t("ai.askBtn")}
          </Button>
        </div>
        {knowledgeA && (
          <AiKnowledgeResult
            answer={knowledgeA}
            blocked={knowledgeMeta?.blocked}
            noSource={knowledgeMeta?.noSource}
            citations={knowledgeMeta?.citations}
            suggestedNextStep={knowledgeMeta?.suggestedNextStep}
          />
        )}
      </Card>

      <p className="text-xs text-muted">{t("ai.disclaimerShort")}</p>
    </div>
  );
}
