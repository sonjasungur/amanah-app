import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/account-recovery-forms";

export const metadata = { title: "Passwort zurücksetzen — Wasiyya", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
