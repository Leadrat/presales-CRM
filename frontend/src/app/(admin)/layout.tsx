"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, BriefcaseBusiness, Users } from "lucide-react";
import AppShellHeader from "@/components/layout/AppShellHeader";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "./guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "Basic";

  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const isAccounts = pathname?.startsWith("/accounts");
  const isTeam = pathname?.startsWith("/team");

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-gray-900 dark:bg-[#020617] dark:text-gray-100">
        {/* Sidebar (fixed) */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 text-gray-900 dark:border-gray-800 dark:bg-[#020617] dark:text-gray-100">
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-xl bg-brand-500" />
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Leadrat CRM</span>
          </div>

          <nav className="space-y-1 text-base font-medium">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`menu-item rounded-xl px-3 py-2 ${
                isDashboard
                  ? "menu-item-active bg-slate-900 text-white dark:bg-white/5 dark:text-white"
                  : "menu-item-inactive text-gray-700 hover:bg-slate-50 dark:text-gray-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </span>
            </button>

            {/* Accounts: Admin view */}
            {role === "Admin" && (
              <button
                type="button"
                onClick={() => router.push("/accounts")}
                className={`menu-item rounded-xl px-3 py-2 ${
                  isAccounts
                    ? "menu-item-active bg-slate-900 text-white dark:bg-white/5 dark:text-white"
                    : "menu-item-inactive text-gray-700 hover:bg-slate-50 dark:text-gray-300"
                }`}
              >
                <span className="flex items-center gap-3">
                  <BriefcaseBusiness className="h-5 w-5" />
                  <span>Accounts</span>
                </span>
              </button>
            )}

            {/* Team (visible link for Admin; switches to protected layout on /team) */}
            <button
              type="button"
              onClick={() => router.push("/team")}
              className={`menu-item rounded-xl px-3 py-2 ${
                isTeam
                  ? "menu-item-active bg-slate-900 text-white dark:bg-white/5 dark:text-white"
                  : "menu-item-inactive text-gray-700 hover:bg-slate-50 dark:text-gray-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <span>Team</span>
              </span>
            </button>
          </nav>
        </aside>

        {/* Main column (scrollable content) */}
        <div className="flex h-screen flex-1 flex-col bg-slate-50 lg:pl-64 dark:bg-[#020617]">
          <AppShellHeader />
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
