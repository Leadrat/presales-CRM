"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { tokenService } from "@/lib/auth/tokenService";

export const AppShellHeader: React.FC = () => {
  const router = useRouter();
  const { user, setUser, setStatus } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const role = user?.role ?? "Basic";
  const displayName = user?.fullName && user.fullName.trim().length > 0 ? user.fullName : user?.email ?? "";
  const email = user?.email ?? "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  const handleSignOut = async () => {
    setOpen(false);
    setUser(null);
    setStatus("unauthenticated");
    await tokenService.logout().catch(() => {
      // ignore errors
    });
    router.replace("/login");
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-[#020617]/90">
      <div className="flex h-14 w-full items-center justify-between px-4 lg:h-16 lg:px-8">
        {/* Left: empty space */}
        <div className="flex items-center gap-3">
          {/* Logo and text removed */}
        </div>

        {/* Right: theme toggle + profile dropdown */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 sm:inline-flex"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              // Sun icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.75V3m0 18v-1.75M7.25 7.25 6 6m12 12-1.25-1.25M4.75 12H3m18 0h-1.75M7.25 16.75 6 18m12-12-1.25 1.25M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                />
              </svg>
            ) : (
              // Moon icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z"
                />
              </svg>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50 sm:px-3.5 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              onClick={() => setOpen((prev) => !prev)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                {initial}
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {displayName || "Signed in"}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                  {role === "Admin" ? "Admin" : "Basic"}
                </span>
              </div>
            </button>

            {open && (
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-xs dark:border-gray-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                    {initial}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-1 dark:text-gray-100">{displayName || "Leadrat user"}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-1 dark:text-gray-400">{email}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{role}</p>
                  </div>
                </div>
                <div className="py-1 text-xs">
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => {
                      setOpen(false);
                      router.push("/profile");
                    }}
                  >
                    Edit profile
                  </button>
                </div>
                <div className="border-t border-gray-800 py-1 text-xs">
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppShellHeader;
