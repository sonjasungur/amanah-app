"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getAuthMode } from "./config";
import { localAuthProvider } from "./local-auth-provider";
import { apiAuthProvider, rememberSession, SESSION_HINT_KEY, sessionUserId } from "./api-auth-provider";
import { getStorageMode } from "./config";
import { discardDeviceDataWithoutSession, syncStoreWithRemoteAfterAuth } from "@/lib/storage/store-sync";
import { wipeDeviceData } from "@/lib/storage/device-data";
import { cancelPendingSave, flushBeforeSignOut } from "@/lib/store/use-amanah-store";
import type { AuthProvider, AuthSession, LoginInput, RegisterInput } from "./types";

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  authMode: "local" | "api";
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string; code?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string; pendingVerification?: boolean }>;
  /** Adopts a session the server already created (e-mail confirmation). */
  adoptSession: (session: AuthSession) => Promise<void>;
  /** Without `force`, refuses while a change may not have reached the account (`unsaved`). */
  logout: (options?: { force?: boolean }) => Promise<LogoutResult>;
}

export interface LogoutResult {
  ok: boolean;
  unsaved?: boolean;
}

/** In API mode the browser only holds a working copy of an account, which a logout removes. */
function keepsWorkingCopy(): boolean {
  return getStorageMode() === "api";
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
  // A login or adopted session wins over a slower initial session check (e.g. e-mail confirmation).
  const sessionVersion = useRef(0);
  const shownUserId = useRef<string | null>(null);
  useEffect(() => {
    shownUserId.current = session?.user.id ?? null;
  }, [session]);

  // Another tab signed out or in as someone else, or the page came back from the back-forward cache
  // after that: this page still holds the old folder in memory. Reloading drops it; the reload then
  // reads only what belongs to the current session.
  useEffect(() => {
    if (!keepsWorkingCopy()) return;
    const sessionChangedElsewhere = () => sessionUserId() !== shownUserId.current;
    const reload = () => {
      cancelPendingSave();
      window.location.reload();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== SESSION_HINT_KEY) return;
      if (sessionChangedElsewhere()) reload();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && sessionChangedElsewhere()) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    const version = sessionVersion.current;
    provider.getSession().then(async (s) => {
      if (sessionVersion.current !== version) {
        setIsLoading(false);
        return;
      }
      setSession(s);
      setIsLoading(false);
      if (s) {
        await syncStoreWithRemoteAfterAuth();
      } else if (keepsWorkingCopy()) {
        discardDeviceDataWithoutSession();
      }
    });
  }, [provider]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await provider.login(input);
      if (result.success && result.session) {
        sessionVersion.current += 1;
        setSession(result.session);
        await syncStoreWithRemoteAfterAuth();
        return { success: true };
      }
      return { success: false, error: result.error, code: result.code };
    },
    [provider]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await provider.register(input);
      if (result.success && result.pendingVerification) {
        return { success: true, pendingVerification: true };
      }
      if (result.success && result.session) {
        setSession(result.session);
        await syncStoreWithRemoteAfterAuth();
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [provider]
  );

  const adoptSession = useCallback(async (next: AuthSession) => {
    sessionVersion.current += 1;
    rememberSession(next);
    setSession(next);
    await syncStoreWithRemoteAfterAuth();
  }, []);

  const logout = useCallback(
    async (options?: { force?: boolean }): Promise<LogoutResult> => {
      const wipe = keepsWorkingCopy();
      if (wipe && !options?.force && !(await flushBeforeSignOut())) return { ok: false, unsaved: true };
      await provider.logout();
      if (wipe) wipeDeviceData();
      sessionVersion.current += 1;
      setSession(null);
      return { ok: true };
    },
    [provider]
  );

  const value = useMemo(
    () => ({ session, isLoading, authMode, login, register, logout, adoptSession }),
    [session, isLoading, authMode, login, register, logout, adoptSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
