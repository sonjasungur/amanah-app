"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAuthMode } from "./config";
import { localAuthProvider } from "./local-auth-provider";
import { apiAuthProvider } from "./api-auth-provider";
import { syncStoreWithRemoteAfterAuth } from "@/lib/storage/store-sync";
import type { AuthProvider, AuthSession, LoginInput, RegisterInput } from "./types";

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  authMode: "local" | "api";
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getProvider(): AuthProvider {
  return getAuthMode() === "api" ? apiAuthProvider : localAuthProvider;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authMode = getAuthMode();
  const provider = useMemo(() => getProvider(), []);

  useEffect(() => {
    provider.getSession().then(async (s) => {
      setSession(s);
      setIsLoading(false);
      if (s) {
        await syncStoreWithRemoteAfterAuth();
      }
    });
  }, [provider]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await provider.login(input);
      if (result.success && result.session) {
        setSession(result.session);
        await syncStoreWithRemoteAfterAuth();
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [provider]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await provider.register(input);
      if (result.success && result.session) {
        setSession(result.session);
        await syncStoreWithRemoteAfterAuth();
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [provider]
  );

  const logout = useCallback(async () => {
    await provider.logout();
    setSession(null);
  }, [provider]);

  const value = useMemo(
    () => ({ session, isLoading, authMode, login, register, logout }),
    [session, isLoading, authMode, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
