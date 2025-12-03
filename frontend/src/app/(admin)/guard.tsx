"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Allow /accounts/new to be handled by its own page-level guard (Basic users can access it).
  const isCreateAccountPage = pathname === "/accounts/new";

  const isAdmin = status === "authenticated" && user && user.role === "Admin";

  useEffect(() => {
    if (isCreateAccountPage) {
      // Let the page-level guard handle auth/role checks for /accounts/new.
      return;
    }

    // Redirect authenticated non-admin users to the 403 page for all other admin routes.
    if (status === "authenticated" && !isAdmin) {
      router.replace("/not-authorized");
    }
  }, [status, isAdmin, router, isCreateAccountPage]);

  // While auth state is being resolved, show nothing here; AuthGate handles global loading.
  if (status === "checking") {
    return null;
  }

  // For /accounts/new, always render children; NewAccountPage has its own guard.
  if (isCreateAccountPage) {
    return <>{children}</>;
  }

  // If not authenticated, AuthGate/(protected) should have already redirected to /login.
  if (status !== "authenticated") {
    return null;
  }

  // Only allow admins through for other admin routes.
  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
