"use client";

import { useState, useRef, useEffect } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { getCriticalMissing } from "@/lib/utils/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Bot, Send, BookOpen, Mail, ListChecks, Languages, AlertCircle } from "lucide-react";

const quickActions = [
  {
    id: "guide",
    label: "Leitfaden",
    icon: BookOpen,
    prompt: "Erkläre mir Schritt für Schritt, wie ich meinen AmanahOrdner am besten ausfülle. Was sollte ich zuerst tun?",
  },
  {
    id: "family_letter",
    label: "Familienbrief",
    icon: Mail,
    prompt: "Erstelle einen einfühlsamen Familienbrief auf Deutsch basierend auf meinen bisherigen Angaben. Erkläre meine wichtigsten Wünsche verständlich.",
  },
  {
    id: "summary",
    label: "Zusammenfassung",
    icon: ListChecks,
    prompt: "Fasse alle meine bisherigen Angaben im AmanahOrdner übersichtlich zusammen — nach Modulen gegliedert.",
  },
  {
    id: "translate",
    label: "Übersetzen",
    icon: Languages,
    prompt: "Übersetze meinen Familienbrief und die wichtigsten Wünsche ins Türkische und Arabische (vereinfacht, für die Familie verständlich).",
  },
  {
    id: "open_points",
    label: "Offene Punkte",
    icon: AlertCircle,
    prompt: "Welche wichtigen Punkte fehlen noch in meinem AmanahOrdner? Was sollte ich als Nächstes ausfüllen?",
  },
];

export default function AssistentPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useAmanahStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const critical = getCriticalMissing(store);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: { amanahData: store, criticalMissing: critical },
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuche es erneut." }]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <Bot size={28} /> Amanah-Assistent
        </h1>
        <p className="text-muted">
          Ich helfe beim Ausfüllen, Zusammenfassen und Strukturieren deines AmanahOrdners.
        </p>
      </div>

      <Disclaimer />

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              size="sm"
              variant="outline"
              onClick={() => send(action.prompt)}
              disabled={loading}
            >
              <Icon size={14} className="mr-1.5" />
              {action.label}
            </Button>
          );
        })}
      </div>

      <Card className="flex flex-col min-h-[60vh] p-0 overflow-hidden">
        <div className="bg-primary text-white px-6 py-4">
          <p className="font-semibold">Chat</p>
          <p className="text-sm text-white/80">Keine Fatwa, keine Rechtsberatung — nur Orientierung und Strukturierung.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[50vh]">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot size={48} className="mx-auto text-primary/30 mb-4" />
              <p className="text-muted text-sm max-w-md mx-auto">
                Stelle eine Frage oder nutze die Schnellaktionen oben.
                Ich kenne deine bisherigen Angaben und kann dir beim Ausfüllen helfen.
              </p>
              {critical.length > 0 && (
                <p className="text-sm text-warning mt-4">
                  {critical.length} kritische Punkte noch offen — frag mich nach dem nächsten Schritt!
                </p>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm rounded-2xl p-4 whitespace-pre-wrap max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary/10 ml-auto text-foreground"
                  : "bg-sand mr-auto text-foreground"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="bg-sand rounded-2xl p-4 text-sm text-muted animate-pulse max-w-[85%]">
              Denke nach...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-primary/10 p-4 flex gap-3 bg-card">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stelle eine Frage oder bitte um Hilfe..."
            className="min-h-[48px] max-h-32 text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="self-end">
            <Send size={18} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
