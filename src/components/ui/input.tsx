"use client";

import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DATE_CHECK_MESSAGES, checkBirthDate, formatDateTyping, formatDisplayDate, toIsoDate } from "@/lib/utils/date-input";

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
 * Date as TT.MM.JJJJ with dots added while typing. Reports ISO (JJJJ-MM-TT) once the date is valid,
 * otherwise the typed text, so that nothing typed is lost. Mobile keyboards show digits.
 */
export function DateInput({
  value,
  onValueChange,
  id,
  className,
  describedBy,
  testId,
}: {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  className?: string;
  describedBy?: string;
  testId?: string;
}) {
  const [text, setText] = useState(() => formatDisplayDate(value));
  const [touched, setTouched] = useState(false);
  const [editing, setEditing] = useState(false);
  const focused = useRef(false);
  // A value that arrives later (loading the account) shows up unless the person is typing.
  useEffect(() => {
    if (!focused.current) setText(formatDisplayDate(value));
  }, [value]);
  const check = checkBirthDate(text);
  // A stored value that is no full date (e.g. "03.07.") is shown as a problem at once, not only after
  // editing: otherwise it would end up incomplete on the emergency card (P2.6).
  const storedIncomplete = !editing && Boolean(value.trim()) && check !== "ok" && check !== "empty";
  const problem = (touched || storedIncomplete) && check !== "ok" && check !== "empty" ? DATE_CHECK_MESSAGES[check] : null;
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div>
      <Input
        id={id}
        value={text}
        inputMode="numeric"
        autoComplete="bday"
        placeholder="TT.MM.JJJJ"
        maxLength={10}
        aria-invalid={problem ? true : undefined}
        aria-describedby={[describedBy, problem ? errorId : undefined].filter(Boolean).join(" ") || undefined}
        className={className}
        data-testid={testId}
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
          onValueChange(toIsoDate(next) ?? next);
        }}
      />
      {problem && (
        <p id={errorId} className="text-xs text-destructive mt-1" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}
