"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import { API_BASE } from "@/lib/api";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  role: string;
} | null;

type AuthContextValue = {
  user: AuthUser;
  status: AuthStatus;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  // Initial best-effort check so pages know auth state.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/me`, { method: "GET", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setStatus("unauthenticated");
          }
          return;
        }
        const data = (await res.json().catch(() => ({}))) as any;
        if (!cancelled) {
          setUser({
            id: data?.data?.id ?? data?.id ?? "",
            email: data?.data?.email ?? data?.email ?? "",
            fullName: data?.data?.fullName ?? data?.fullName ?? undefined,
            role: data?.data?.role ?? data?.role ?? "Basic",
          });
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, setUser, setStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
