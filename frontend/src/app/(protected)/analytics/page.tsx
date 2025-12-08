"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAnalyticsAccounts, getDemosBySize, getUsers, AnalyticsAccountsSummary, DemosBySizeSummary, UserSummary } from "@/lib/api";

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;
  const toIso = to.toISOString().slice(0, 10);
  const fromIso = from.toISOString().slice(0, 10);
  return { fromIso, toIso };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const defaultRange = getCurrentMonthRange();
  const [from, setFrom] = useState<string>(defaultRange.fromIso);
  const [to, setTo] = useState<string>(defaultRange.toIso);
  const [selectedUserId, setSelectedUserId] = useState<string | "all" | "me">("all");
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [accountsSummary, setAccountsSummary] = useState<AnalyticsAccountsSummary | null>(null);
  const [demosBySize, setDemosBySize] = useState<DemosBySizeSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const list = await getUsers();
        if (!cancelled) setUsers(list);
      } catch {
        // non-fatal for analytics page
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const effectiveUserId = !isAdmin ? user?.id ?? null : selectedUserId === "all" ? null : selectedUserId === "me" ? user?.id ?? null : selectedUserId;

        const [accountData, demosData] = await Promise.all([
          getAnalyticsAccounts({ from: from || undefined, to: to || undefined, userId: effectiveUserId ?? undefined }),
          getDemosBySize({ from: from || undefined, to: to || undefined, userId: effectiveUserId ?? undefined }),
        ]);

        if (cancelled) return;

        setAccountsSummary(accountData);
        setDemosBySize(demosData);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load analytics");
        setAccountsSummary(null);
        setDemosBySize(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [from, to, selectedUserId, isAdmin, user?.id]);

  const displayAccounts = accountsSummary ?? { created: 0, modified: 0, booked: 0, lost: 0 };
  const displayDemosBySize = demosBySize ?? { small: 0, medium: 0, enterprise: 0 };

  const allZero =
    displayAccounts.created === 0 &&
    displayAccounts.modified === 0 &&
    displayAccounts.booked === 0 &&
    displayAccounts.lost === 0 &&
    displayDemosBySize.small === 0 &&
    displayDemosBySize.medium === 0 &&
    displayDemosBySize.enterprise === 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-[#020617] dark:text-gray-100 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-base text-gray-600 dark:text-gray-400">
            Analyze account and demo performance over time.
          </p>
        </div>
        {/* User filter (Admin only) */}
        {isAdmin && (
          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">User Filter</p>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value as any)}
              className="h-9 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
            >
              <option value="all">All users</option>
              <option value="me">Me only</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Main analytics content */}
        <div className="space-y-6">
          {/* KPI cards – each with its own From/To filter (shared state) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Created */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Created</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">From</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">To</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-indigo-50 py-6 text-center text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                <p className="text-3xl font-semibold">
                  {loading && !accountsSummary ? "--" : displayAccounts.created}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
              </div>
            </div>

            {/* Modified */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Modified</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">From</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">To</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-violet-50 py-6 text-center text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                <p className="text-3xl font-semibold">
                  {loading && !accountsSummary ? "--" : displayAccounts.modified}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
              </div>
            </div>

            {/* Booked */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Booked</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">From</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">To</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-emerald-50 py-6 text-center text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                <p className="text-3xl font-semibold">
                  {loading && !accountsSummary ? "--" : displayAccounts.booked}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
              </div>
            </div>

            {/* Lost */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Lost</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">From</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">To</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-rose-50 py-6 text-center text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                <p className="text-3xl font-semibold">
                  {loading && !accountsSummary ? "--" : displayAccounts.lost}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
              </div>
            </div>
          </div>

          {/* Demos by Account Size */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Demos by Account Size</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Count of demos grouped by the size of the account.
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Small (10–24 users)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {loading && !demosBySize ? "--" : displayDemosBySize.small}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Medium (25–49 users)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {loading && !demosBySize ? "--" : displayDemosBySize.medium}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Enterprise (50+ users)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {loading && !demosBySize ? "--" : displayDemosBySize.enterprise}
                </span>
              </div>
            </div>

            {allZero && !loading && !error && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                No analytics data found for the selected range. Try expanding the date range or adjusting filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
