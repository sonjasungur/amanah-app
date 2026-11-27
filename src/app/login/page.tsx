import type { Metadata } from "next";
import { AuthFormShell } from "@/components/auth/auth-form-shell";

export const metadata: Metadata = { title: "Anmelden — Wasiyya", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <AuthFormShell mode="login" />;
}
