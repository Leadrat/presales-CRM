"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const fullName = user?.fullName && user.fullName.trim().length > 0 ? user.fullName : "-";
  const email = user?.email ?? "-";
  const role = user?.role ?? "-";
  const isAdmin = user?.role === "Admin";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Profile</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Basic account information for your Leadrat CRM user.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-8">
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Name</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{fullName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{role}</dd>
            </div>
          </dl>

          {isAdmin && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
                onClick={() => router.push("/accounts/new")}
              >
                Create account
              </button>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            Additional profile fields (phone, address, preferences, etc.) can be added here later.
          </p>
        </div>
      </div>
    </div>
  );
}
