"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminAccountDetailPage from "@/app/(admin)/accounts/[id]/page";

export default function MyAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();

  // If an Admin somehow hits the Basic route, send them to the Admin detail page
  useEffect(() => {
    if (user?.role === "Admin" && id) {
      router.replace(`/accounts/${id}`);
    }
  }, [user, id, router]);

  // While redirecting admins, render nothing
  if (user?.role === "Admin") {
    return null;
  }

  // Basic users reuse the admin account detail UI
  return <AdminAccountDetailPage />;
}
