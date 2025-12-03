"use client";

import React from "react";
import AdminGuard from "@/app/(admin)/guard";

export default function AdminAccountsLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
