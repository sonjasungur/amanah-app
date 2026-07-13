"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { useI18n } from "@/lib/i18n/context";

export function AmanahAssistantFloat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useAmanahStore();
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMsg }],
          context: { amanahData: store },
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Entschuldigung, ein Fehler ist aufgetreten." }]);
    }
    setLoading(false);
  };

  if (pathname.includes("/print") || pathname === "/check") return null;

  return (
    <div className="no-print">
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-md bg-card rounded-2xl shadow-2xl border border-primary/20 flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-primary text-white rounded-t-2xl">
            <span className="font-semibold flex items-center gap-2">
              <MessageCircle size={20} /> {t("assistant.title")}
            </span>
            <button onClick={() => setOpen(false)} aria-label="Schließen"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-sm text-muted">
                Ich helfe beim Ausfüllen, Zusammenfassen und Strukturieren. Keine Fatwa, keine Rechtsberatung.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm rounded-xl p-3 whitespace-pre-wrap ${msg.role === "user" ? "bg-primary/10 ml-8" : "bg-sand mr-8"}`}>
                {msg.content}
              </div>
            ))}
            {loading && <p className="text-sm text-muted animate-pulse">Denke nach...</p>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-primary/10 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("assistant.placeholder")}
              className="min-h-[40px] text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button size="sm" onClick={send} disabled={loading} className="self-end">
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-light transition-colors"
        aria-label={t("assistant.title")}
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
}
