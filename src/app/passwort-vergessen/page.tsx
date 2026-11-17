import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/account-recovery-forms";

export const metadata = { title: "Passwort vergessen — Amanah – Mein Wille", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
