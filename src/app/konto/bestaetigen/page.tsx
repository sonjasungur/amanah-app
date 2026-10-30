import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/account-recovery-forms";

export const metadata = { title: "E-Mail bestätigen — Mein Wille", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
