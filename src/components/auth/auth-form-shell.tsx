import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export function AuthFormShell({ mode }: { mode: "login" | "register" }) {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 text-muted">Laden …</div>}>
      <AuthForm mode={mode} />
    </Suspense>
  );
}
