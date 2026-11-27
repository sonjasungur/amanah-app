"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getAuthMode, getStorageMode } from "@/lib/auth/config";
import { buildAuthHref } from "@/lib/auth/return-url";
import { Loader2 } from "lucide-react";

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const requiresAuth = getStorageMode() === "api" && getAuthMode() === "api";

  useEffect(() => {
    if (!requiresAuth || isLoading || session) return;
    // Keep the query (e.g. ?step=3) so the person returns to the same place; sanitised again on the login page.
    const search = typeof window === "undefined" ? "" : window.location.search;
    router.replace(buildAuthHref("/login", `${pathname}${search}`));
  }, [requiresAuth, isLoading, session, pathname, router]);

  if (!requiresAuth) return children;

  if (isLoading || !session) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-muted"
        data-testid="dashboard-auth-gate-loading"
        role="status"
      >
        <Loader2 className="animate-spin mr-2" size={20} aria-hidden />
        {isLoading ? "Wird geladen …" : "Weiterleitung zur Anmeldung …"}
      </div>
    );
  }

  return children;
}
