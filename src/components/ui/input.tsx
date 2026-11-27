"use client";

import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { DATE_CHECK_MESSAGES, checkBirthDate, dateDraftMessage, formatDateTyping, formatDisplayDate, storableDate } from "@/lib/utils/date-input";
import { useFieldCorrections } from "@/lib/store/field-corrections";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border-2 border-primary/25 bg-white px-4 py-2.5 text-foreground placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/** Longer than any real word or link. Browsers need minutes to wrap one word of a million characters. */
export const LONG_WORD_CHARS = 2000;

export function hasLongWord(text: string): boolean {
  if (text.length < LONG_WORD_CHARS) return false;
  let run = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    run = code === 32 || code === 10 || code === 9 || code === 13 ? 0 : run + 1;
    if (run >= LONG_WORD_CHARS) return true;
  }
  return false;
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    const inner = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement);

    // Browsers wrap while inserting, before React could react. So the wrapping stops before that.
    useEffect(() => {
      const element = inner.current;
      if (!element) return;
      const beforeInput = (event: InputEvent) => {
        if (event.data && hasLongWord(event.data)) element.style.whiteSpace = "pre";
      };
      const paste = (event: ClipboardEvent) => {
        if (hasLongWord(event.clipboardData?.getData("text") ?? "")) element.style.whiteSpace = "pre";
      };
      element.addEventListener("beforeinput", beforeInput);
      element.addEventListener("paste", paste);
      return () => {
        element.removeEventListener("beforeinput", beforeInput);
        element.removeEventListener("paste", paste);
      };
    }, []);

    const longWord = typeof props.value === "string" && hasLongWord(props.value);
    useLayoutEffect(() => {
      if (inner.current) inner.current.style.whiteSpace = longWord ? "pre" : "";
    }, [longWord, props.value]);

    return (
      <textarea
        ref={inner}
        className={cn(
          "w-full rounded-xl border-2 border-primary/25 bg-white px-4 py-2.5 text-foreground placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-sm font-medium text-foreground mb-1.5", className)} {...props}>
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border-2 border-primary/25 bg-white px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/**
 * A password field with an eye button inside it. The button only switches the display; the value,
 * autocomplete and form behaviour stay the same. `data-password` lets forms find the field in either state.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} {...props} type={visible ? "text" : "password"} data-password="" autoCapitalize="none" spellCheck={false} className={cn("pr-12", className)} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-lg text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          data-testid="password-toggle"
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

/**
 * Date as TT.MM.JJJJ with dots added while typing. Mobile keyboards show digits.
 * Only a real calendar date (as ISO, JJJJ-MM-TT) or a deliberately emptied field is handed on to the
 * folder. Unfinished or impossible text ("03.07.", "31.02.1962") is an open draft (P2.6 owner
 * acceptance): it stays in the field, also after leaving the page, is named at the field and in the save
 * bar, keeps old dates out of previews and blocks exports, until it is corrected or explicitly discarded.
 * With `draftKey` the draft outlives the field (navigation, reload); without it, it ends with the field.
 */
export function DateInput({
  value,
  onValueChange,
  id,
  className,
  describedBy,
  testId,
  draftKey,
  path = "",
  label = "Datum",
  birth = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  className?: string;
  describedBy?: string;
  testId?: string;
  /** Stable key of this field (e.g. "emergencyCard.birthDate"), so an open draft survives leaving the page. */
  draftKey?: string;
  /** Folder path the draft stands in for in documents, e.g. "emergencyCard.birthDate". */
  path?: string;
  /** Field name for notices, e.g. "Geburtsdatum". */
  label?: string;
  /** A birth date: the hints say "Geburtsdatum". */
  birth?: boolean;
}) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const key = draftKey ?? fieldId;
  const stored = formatDisplayDate(value);
  const [text, setText] = useState(() => useFieldCorrections.getState().open[key]?.text ?? stored);
  const [touched, setTouched] = useState(() => Boolean(useFieldCorrections.getState().open[key]));
  const [editing, setEditing] = useState(false);
  const focused = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const report = useFieldCorrections((s) => s.report);
  const discardCount = useFieldCorrections((s) => s.discarded[key] ?? 0);
  const focusKey = useFieldCorrections((s) => s.focusKey);
  // A value that arrives later (loading the account) shows up unless the person is typing or a draft is open.
  useEffect(() => {
    if (!focused.current && !useFieldCorrections.getState().open[key]) setText(formatDisplayDate(value));
  }, [value, key]);
  // Discarded (here or from a notice elsewhere): the stored value is shown again.
  const seenDiscard = useRef(discardCount);
  useEffect(() => {
    if (discardCount === seenDiscard.current) return;
    seenDiscard.current = discardCount;
    setText(formatDisplayDate(value));
    setTouched(false);
  }, [discardCount, value]);
  // "Zum Feld" from another page: focus this field once it is there.
  useEffect(() => {
    if (focusKey !== key || !input.current) return;
    input.current.scrollIntoView({ block: "center" });
    input.current.focus();
    useFieldCorrections.getState().requestFocus(null);
  }, [focusKey, key]);

  const check = checkBirthDate(text);
  const isDraft = text.trim() !== stored.trim();
  // A stored value that is no real date (older folders, e.g. "03.07.") is named at once, not only after editing.
  const storedInvalid = !editing && !isDraft && Boolean(value.trim()) && (check === "incomplete" || check === "invalid");
  const problem =
    (touched || storedInvalid) && check !== "ok" && check !== "empty"
      ? check === "future"
        ? DATE_CHECK_MESSAGES.future
        : dateDraftMessage(check, birth)
      : null;
  const errorId = `${fieldId}-error`;
  // An open draft: typed, not storable, not yet discarded. The folder still holds `value`.
  const blocked = (check === "incomplete" || check === "invalid") && isDraft;
  const hint = !problem || check === "future" ? null : check === "incomplete" ? "Bitte als TT.MM.JJJJ eingeben, zum Beispiel 15.03.1980." : "Bitte Tag und Monat prüfen.";

  useEffect(() => {
    // Reported while typing already, so leaving right after typing is caught as well.
    if (blocked) {
      report(key, { text, message: dateDraftMessage(check as "incomplete" | "invalid", birth), label, path, href: typeof window === "undefined" ? "" : window.location.pathname + window.location.search });
    } else {
      report(key, null);
    }
  }, [report, key, blocked, text, check, birth, label, path]);
  // Without a stable key the draft ends with the field; with one it stays open until corrected or discarded.
  useEffect(() => () => {
    if (!draftKey) report(key, null);
  }, [report, key, draftKey]);

  const discard = () => {
    useFieldCorrections.getState().discard(key);
    setText(stored);
    setTouched(false);
  };

  return (
    <div>
      <Input
        ref={input}
        id={fieldId}
        value={text}
        inputMode="numeric"
        autoComplete="bday"
        placeholder="TT.MM.JJJJ"
        maxLength={10}
        aria-invalid={problem ? true : undefined}
        aria-describedby={[describedBy, problem ? errorId : undefined].filter(Boolean).join(" ") || undefined}
        // Error state that does not rely on colour alone: thicker border, icon and a bold hint.
        className={cn(problem && "border-[3px] border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/30", className)}
        data-testid={testId}
        data-error={problem ? "true" : undefined}
        data-draft-key={key}
        onFocus={() => {
          focused.current = true;
          setEditing(true);
        }}
        onBlur={() => {
          focused.current = false;
          setEditing(false);
          setTouched(true);
        }}
        onChange={(e) => {
          const next = formatDateTyping(e.target.value, text);
          setText(next);
          const storable = storableDate(next);
          if (storable !== null && storable !== value) onValueChange(storable);
        }}
      />
      {problem && (
        <div id={errorId} className="mt-1.5 border-l-4 border-destructive pl-2.5 text-destructive" role="alert" data-testid={testId ? `${testId}-error` : undefined}>
          <p className="flex items-start gap-2 text-base font-semibold leading-snug">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span>{problem}</span>
          </p>
          {hint && <p className="text-sm text-foreground/80">{hint}</p>}
          {blocked && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-foreground/80">
              <span>Noch nicht gespeichert.</span>
              <button type="button" onClick={discard} className="font-semibold text-primary underline min-h-[44px]" data-testid={testId ? `${testId}-discard` : "date-discard"}>
                Änderung verwerfen
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
