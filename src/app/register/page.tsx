import type { Metadata } from "next";
import { AuthFormShell } from "@/components/auth/auth-form-shell";

export const metadata: Metadata = { title: "Konto erstellen — Wasiyya", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return <AuthFormShell mode="register" />;
}
