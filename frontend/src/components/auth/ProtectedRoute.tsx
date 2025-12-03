"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../../lib/api/fetchWithAuth";
import { API_BASE } from "../../lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/me`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!isMounted) return;
          router.replace("/login");
          return;
        }
      } catch {
        if (!isMounted) return;
        router.replace("/login");
        return;
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    // Only run in browser
    if (typeof window !== "undefined") {
      checkAuth();
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
