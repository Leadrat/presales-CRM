"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "checking") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated") {
      if (user?.role === "Admin") {
        router.replace("/accounts");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Redirecting…</p>
    </div>
  );
}
