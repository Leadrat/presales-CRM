"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, BriefcaseBusiness, Building2, Trophy } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AppShellHeader from "@/components/layout/AppShellHeader";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const role = user?.role ?? "Basic";

  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const isAccounts = pathname?.startsWith("/accounts");
  const isMyAccounts = pathname?.startsWith("/my-accounts");
  const isTeam = pathname?.startsWith("/team");
  const isLeaderboard = pathname?.startsWith("/leaderboard");

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-gray-900 dark:bg-[#020617] dark:text-gray-100">
        {/* Sidebar (fixed) */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 text-gray-900 dark:border-gray-800 dark:bg-[#020617] dark:text-gray-100">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="6" strokeOpacity="0.6" />
                <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">ABM CRM</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sales Intelligence</p>
            </div>
          </div>

          <nav className="space-y-1 text-base font-medium">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`menu-item rounded-xl px-3 py-2 ${
                isDashboard
                  ? "menu-item-active bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-300"
                  : "menu-item-inactive text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </span>
            </button>

            {/* Accounts: visible only for Basic users (not Admin) */}
            {role !== "Admin" && (
              <button
                type="button"
                onClick={() => router.push("/my-accounts")}
                className={`menu-item rounded-xl px-3 py-2 ${
                  isMyAccounts
                    ? "menu-item-active bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-300"
                    : "menu-item-inactive text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <span>Accounts</span>
                </span>
              </button>
            )}

            {/* Admin view: All accounts */}
            {role === "Admin" && (
              <button
                type="button"
                onClick={() => router.push("/accounts")}
                className={`menu-item rounded-xl px-3 py-2 ${
                  isAccounts
                    ? "menu-item-active bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-300"
                    : "menu-item-inactive text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <span>Accounts</span>
                </span>
              </button>
            )}

            {/* Team (visible for all roles) */}
            <button
              type="button"
              onClick={() => router.push("/team")}
              className={`menu-item rounded-xl px-3 py-2 ${
                isTeam
                  ? "menu-item-active bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-300"
                  : "menu-item-inactive text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <span>Team</span>
              </span>
            </button>

            {/* Leaderboard (visible for all roles) */}
            <button
              type="button"
              onClick={() => router.push("/leaderboard")}
              className={`menu-item rounded-xl px-3 py-2 ${
                isLeaderboard
                  ? "menu-item-active bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-300"
                  : "menu-item-inactive text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <Trophy className="h-5 w-5" />
                <span>Leaderboard</span>
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
    </ProtectedRoute>
  );
}
