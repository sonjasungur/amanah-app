"use client";

import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";

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
