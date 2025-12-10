"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getDashboardSummary,
  getAnalyticsAccounts,
  getDemosBySize,
  getTeamUsers,
  AnalyticsAccountsSummary,
  DemosBySizeSummary,
  TeamUser,
} from "@/lib/api";
import { BoxCubeIcon, CalenderIcon, CheckCircleIcon, TimeIcon, ArrowUpIcon } from "@/icons";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DateTimePicker from "@/components/form/date-time-picker";

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;
  const toIso = to.toISOString().slice(0, 10);
  const fromIso = from.toISOString().slice(0, 10);
  return { fromIso, toIso };
}

type PresetKey =
  | "thisMonth"
  | "last7Days"
  | "last30Days"
  | "last3Months"
  | "last6Months"
  | "last12Months";

function getPresetRange(preset: PresetKey) {
  const now = new Date();
  const to = new Date(now);

  if (preset === "thisMonth") {
    return getCurrentMonthRange();
  }

  if (preset === "last7Days") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return {
      fromIso: from.toISOString().slice(0, 10),
      toIso: to.toISOString().slice(0, 10),
    };
  }

  if (preset === "last30Days") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return {
      fromIso: from.toISOString().slice(0, 10),
      toIso: to.toISOString().slice(0, 10),
    };
  }

  if (preset === "last3Months") {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 3);
    return {
      fromIso: from.toISOString().slice(0, 10),
      toIso: to.toISOString().slice(0, 10),
    };
  }

  if (preset === "last6Months") {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 6);
    return {
      fromIso: from.toISOString().slice(0, 10),
      toIso: to.toISOString().slice(0, 10),
    };
  }

  if (preset === "last12Months") {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 12);
    return {
      fromIso: from.toISOString().slice(0, 10),
      toIso: to.toISOString().slice(0, 10),
    };
  }

  return getCurrentMonthRange();
}

function FilterGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16l-6.4 7.2v5.3L10.4 20v-8.8z" />
    </svg>
  );
}

function BuildingGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="9" width="6" height="11" rx="1" />
      <rect x="14" y="4" width="6" height="16" rx="1" />
      <path d="M7 13h0.01M7 17h0.01M17 8h0.01M17 12h0.01M17 16h0.01" />
    </svg>
  );
}

function SizeBucketGlyph({ className }: { className?: string }) {
  return <Building2 className={className} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [accountCount, setAccountCount] = useState<number | null>(null);
  const [demosScheduled, setDemosScheduled] = useState<number | null>(null);
  const [demosCompleted, setDemosCompleted] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [showCreatedToast, setShowCreatedToast] = useState(false);

  // Compact analytics summary (Spec 19) – simple all-time view
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsAccountsSummary | null>(null);
  const [analyticsDemosBySize, setAnalyticsDemosBySize] = useState<DemosBySizeSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  // Lifetime by default: keep range empty until user selects
  const [analyticsFrom, setAnalyticsFrom] = useState<string>("");
  const [analyticsTo, setAnalyticsTo] = useState<string>("");
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const presetMenuRef = useRef<HTMLDivElement | null>(null);
  const presetButtonRef = useRef<HTMLButtonElement | null>(null);

  const isAdmin = user?.role === "Admin";

  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[] | null>(null);
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [userFilterLoading, setUserFilterLoading] = useState<boolean>(false);
  const [userFilterError, setUserFilterError] = useState<string | null>(null);

  // Detect "created" query param and trigger a one-time success toast
  useEffect(() => {
    const created = searchParams.get("created");
    if (created === "1") {
      setShowCreatedToast(true);
      // Replace URL to remove the query param so toast doesn't reappear on refresh
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  // Auto-hide the created toast after a short delay
  useEffect(() => {
    if (!showCreatedToast) return;

    const timer = setTimeout(() => {
      setShowCreatedToast(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [showCreatedToast]);

  // Admin-only: load team users and restore dashboard_user_filter from sessionStorage
  useEffect(() => {
    if (!isAdmin) {
      setTeamUsers([]);
      setSelectedUserIds(null);
      return;
    }

    let cancelled = false;

    const loadUsersAndSelection = async () => {
      if (typeof window === "undefined") {
        return;
      }

      setUserFilterLoading(true);
      setUserFilterError(null);

      let savedRaw: string | null = null;
      try {
        savedRaw = window.sessionStorage.getItem("dashboard_user_filter");
      } catch {
        savedRaw = null;
      }

      try {
        const page = await getTeamUsers({ status: "active", pageSize: 500 });
        if (cancelled) return;

        const items = page.items ?? [];
        setTeamUsers(items);

        const activeIds = new Set(items.map((u) => u.id));

        let nextSelection: string[] | null = null;

        if (savedRaw && savedRaw !== "ALL") {
          try {
            const parsed = JSON.parse(savedRaw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((id) => typeof id === "string" && activeIds.has(id));
              if (filtered.length > 0) {
                nextSelection = filtered;
                try {
                  window.sessionStorage.setItem("dashboard_user_filter", JSON.stringify(filtered));
                } catch {
                }
              } else {
                try {
                  window.sessionStorage.setItem("dashboard_user_filter", "ALL");
                } catch {
                }
              }
            }
          } catch {
            try {
              window.sessionStorage.setItem("dashboard_user_filter", "ALL");
            } catch {
            }
          }
        } else {
          // First load of this session or explicit ALL – ensure key is set
          try {
            window.sessionStorage.setItem("dashboard_user_filter", "ALL");
          } catch {
          }
        }

        setSelectedUserIds(nextSelection);
      } catch (err: any) {
        if (cancelled) return;
        setUserFilterError(err?.message || "Failed to load team members");
        setTeamUsers([]);
        setSelectedUserIds(null);
      } finally {
        if (!cancelled) {
          setUserFilterLoading(false);
        }
      }
    };

    loadUsersAndSelection();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        let filterUserIds: string[] | null = null;
        if (user?.id) {
          if (isAdmin) {
            filterUserIds = selectedUserIds && selectedUserIds.length > 0 ? selectedUserIds : null;
          } else {
            filterUserIds = [user.id];
          }
        }

        const summary = await getDashboardSummary(
          filterUserIds && filterUserIds.length > 0 ? { userIds: filterUserIds } : undefined,
        );
        if (cancelled) return;

        // Global totals across all users (Admin and Basic see same counts)
        setAccountCount(summary.totalAccountsCreated);
        setDemosScheduled(summary.demosScheduled);
        setDemosCompleted(summary.demosCompleted);
      } catch (err: any) {
        if (cancelled) return;
        setStatsError(err?.message || "Failed to load dashboard stats");
        setAccountCount(null);
        setDemosScheduled(null);
        setDemosCompleted(null);
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isAdmin, selectedUserIds]);

  // Load a simple global analytics snapshot for dashboard (no filters)
  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        let filterUserIds: string[] | null = null;
        if (user?.id) {
          if (isAdmin) {
            filterUserIds = selectedUserIds && selectedUserIds.length > 0 ? selectedUserIds : null;
          } else {
            filterUserIds = [user.id];
          }
        }

        const [accounts, demosBySize] = await Promise.all([
          getAnalyticsAccounts({
            from: analyticsFrom || undefined,
            to: analyticsTo || undefined,
            userIds: filterUserIds && filterUserIds.length > 0 ? filterUserIds : null,
          }),
          // Demos by Account Size should always show lifetime data, independent of the date range
          getDemosBySize({
            userIds: filterUserIds && filterUserIds.length > 0 ? filterUserIds : null,
          }),
        ]);

        if (cancelled) return;

        setAnalyticsSummary(accounts);
        setAnalyticsDemosBySize(demosBySize);
      } catch (err: any) {
        if (cancelled) return;
        setAnalyticsError(err?.message || "Failed to load analytics");
        setAnalyticsSummary(null);
        setAnalyticsDemosBySize(null);
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [analyticsFrom, analyticsTo, isAdmin, selectedUserIds, user?.id]);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!presetMenuOpen) {
        return;
      }

      const target = event.target as Node;
      if (presetMenuRef.current?.contains(target) || presetButtonRef.current?.contains(target)) {
        return;
      }

      setPresetMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickAway);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
    };
  }, [presetMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPresetMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const quickRangeOptions: { label: string; preset: PresetKey }[] = [
    { label: "This month", preset: "thisMonth" },
    { label: "Last 7 days", preset: "last7Days" },
    { label: "Last 30 days", preset: "last30Days" },
    { label: "Last 3 months", preset: "last3Months" },
    { label: "Last 6 months", preset: "last6Months" },
    { label: "Last 12 months", preset: "last12Months" },
  ];

  const applyPreset = (preset: PresetKey) => {
    const { fromIso, toIso } = getPresetRange(preset);
    setAnalyticsFrom(fromIso);
    setAnalyticsTo(toIso);
    setPresetMenuOpen(false);
  };

  const demoBuckets = [
    {
      key: "small",
      label: "Small (10-24 users)",
      count: analyticsDemosBySize?.small ?? 0,
      badgeBg: "bg-indigo-100/80 dark:bg-indigo-900/40",
      badgeText: "text-indigo-600 dark:text-indigo-200",
    },
    {
      key: "medium",
      label: "Medium (25-49 users)",
      count: analyticsDemosBySize?.medium ?? 0,
      badgeBg: "bg-purple-100/80 dark:bg-purple-900/40",
      badgeText: "text-purple-600 dark:text-purple-200",
    },
    {
      key: "enterprise",
      label: "Enterprise (50+ users)",
      count: analyticsDemosBySize?.enterprise ?? 0,
      badgeBg: "bg-emerald-100/80 dark:bg-emerald-900/40",
      badgeText: "text-emerald-600 dark:text-emerald-200",
    },
  ];

  const formatDemoCount = (count: number) => `${count} demo${count === 1 ? "" : "s"}`;

  const totalAccountsCount = loadingStats
    ? "--"
    : accountCount !== null
    ? accountCount.toString()
    : "--";

  const displayTotalAccountCount = totalAccountsCount;

  const displayDemosScheduled = loadingStats
    ? "--"
    : demosScheduled !== null
    ? demosScheduled.toString()
    : "--";

  const displayDemosCompleted = loadingStats
    ? "--"
    : demosCompleted !== null
    ? demosCompleted.toString()
    : "--";

  const revisitDemos =
    demosScheduled !== null && demosCompleted !== null
      ? Math.max(demosScheduled - demosCompleted, 0)
      : null;

  const displayRevisitDemos = loadingStats
    ? "--"
    : revisitDemos !== null
    ? revisitDemos.toString()
    : "--";

  const conversionRate =
    demosScheduled && demosScheduled > 0 && demosCompleted !== null
      ? Math.round((demosCompleted / demosScheduled) * 100)
      : 0;

  const allTeamUserIds = teamUsers.map((u) => u.id);
  const isAllTeamMembersSelected =
    allTeamUserIds.length === 0 || !selectedUserIds || selectedUserIds.length === 0;

  const persistUserFilter = (ids: string[] | null) => {
    if (typeof window === "undefined") return;
    try {
      if (!ids || ids.length === 0) {
        window.sessionStorage.setItem("dashboard_user_filter", "ALL");
      } else {
        window.sessionStorage.setItem("dashboard_user_filter", JSON.stringify(ids));
      }
    } catch {
      // Best-effort only
    }
  };

  const handleUserToggle = (userId: string) => {
    if (!isAdmin || allTeamUserIds.length === 0) return;

    const base = selectedUserIds && selectedUserIds.length > 0 ? [...selectedUserIds] : [...allTeamUserIds];
    const index = base.indexOf(userId);
    let next: string[] = [];

    if (index >= 0) {
      next = base.filter((id) => id !== userId);
    } else {
      next = [...base, userId];
    }

    if (next.length === 0 || next.length === allTeamUserIds.length) {
      setSelectedUserIds(null);
      persistUserFilter(null);
    } else {
      setSelectedUserIds(next);
      persistUserFilter(next);
    }
  };

  const handleSelectAll = () => {
    if (!isAdmin) return;
    setSelectedUserIds(null);
    persistUserFilter(null);
  };

  const handleClearAll = () => {
    if (!isAdmin) return;
    setSelectedUserIds(null);
    persistUserFilter(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-[#020617] dark:text-gray-100 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-base text-gray-600 dark:text-gray-400">
            Track performance and account activity.
          </p>
        </div>

        {showCreatedToast && (
          <div className="rounded-xl border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-100 shadow-theme-sm">
            <p className="font-medium">Account created successfully.</p>
            <p className="mt-0.5 text-xs text-emerald-200/80">
              You can find it in your My Accounts list and it will be reflected in the dashboard metrics.
            </p>
          </div>
        )}

        {/* Main content */}
        <div className="space-y-6">
          {isAdmin && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">View Dashboard For</p>
              </div>
              <div className="mt-4 w-full max-w-md">
                <div className="relative">
                  <button
                    type="button"
                    disabled={userFilterLoading || teamUsers.length === 0}
                    onClick={() => setUserFilterOpen((prev) => !prev)}
                    className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-900 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-1 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-brand-300"
                  >
                    <div className="flex min-w-0 flex-wrap gap-2">
                      {isAllTeamMembersSelected || teamUsers.length === 0 ? (
                        <span className="truncate text-gray-500 dark:text-gray-400">All team members</span>
                      ) : (
                        <span className="truncate text-gray-500 dark:text-gray-400">
                          {selectedUserIds?.length || 0} members selected
                        </span>
                      )}
                    </div>
                    <svg
                      className={`ml-2 h-4 w-4 text-gray-500 transition-transform dark:text-gray-400 ${userFilterOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {userFilterOpen && (
                    <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-300">
                        <button
                          type="button"
                          disabled={teamUsers.length === 0}
                          onClick={handleSelectAll}
                          className="text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          disabled={teamUsers.length === 0}
                          onClick={handleClearAll}
                          className="text-gray-500 hover:text-gray-700 disabled:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                          {teamUsers.map((u) => {
                            const isChecked =
                              isAllTeamMembersSelected || selectedUserIds?.includes(u.id);
                            const label = u.fullName || u.email;
                            return (
                              <li key={u.id}>
                                <button
                                  type="button"
                                  onClick={() => handleUserToggle(u.id)}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                                        isChecked
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-gray-300 bg-white text-transparent dark:border-gray-600 dark:bg-gray-900"
                                      }`}
                                    >
                                      <svg
                                        className="h-3 w-3"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M3.5 8.5L6.5 11.5L12.5 4.5"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </span>
                                    <span className="truncate text-gray-800 dark:text-gray-100">{label}</span>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                          {teamUsers.length === 0 && !userFilterLoading && (
                            <li className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">No active team members found.</li>
                          )}
                        </ul>
                      </div>
                      
                      {/* Selected Pills Section */}
                      {teamUsers.length > 0 && (
                        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
                          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Selected members</p>
                          <div className="flex flex-wrap gap-2">
                            {(isAllTeamMembersSelected ? teamUsers : (selectedUserIds || []))?.map((userOrId) => {
                              const user = typeof userOrId === 'string' ? teamUsers.find((u) => u.id === userOrId) : userOrId;
                              if (!user) return null;
                              const label = user.fullName || user.email;
                              return (
                                <span
                                  key={user.id}
                                  className="flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                >
                                  <span className="max-w-[120px] truncate">{label}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUserToggle(user.id)}
                                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                  >
                                    <svg
                                      className="h-2.5 w-2.5"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 4L4 12M4 4L12 12"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {userFilterError && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{userFilterError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-5">
            {/* Total Accounts Created */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50">
                <BoxCubeIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Accounts Created</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{totalAccountsCount}</p>
              </div>
            </div>

            {/* Demos Scheduled */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50">
                <CalenderIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Demos Scheduled</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{displayDemosScheduled}</p>
              </div>
            </div>

            {/* Demos Completed */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Demos Completed</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{displayDemosCompleted}</p>
              </div>
            </div>

            {/* Revisit Demos */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50">
                <TimeIcon className="w-6 h-6 text-slate-500" />
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Revisit Demos</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{displayRevisitDemos}</p>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50">
                <ArrowUpIcon className="w-6 h-6 text-amber-500" />
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{loadingStats ? "--" : `${conversionRate}%`}</p>
              </div>
            </div>
          </div>

          {/* Analytics Overview (Spec 19) */}
          <div className="mt-4 space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-slate-900">
              {/* Date Range Inputs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">From</span>
                  <DateTimePicker
                    id="analytics-from-global"
                    value={analyticsFrom || undefined}
                    onChange={(val) => setAnalyticsFrom(val)}
                    placeholder="dd-mm-yyyy"
                    enableTime={false}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">To</span>
                  <DateTimePicker
                    id="analytics-to-global"
                    value={analyticsTo || undefined}
                    onChange={(val) => setAnalyticsTo(val)}
                    placeholder="dd-mm-yyyy"
                    enableTime={false}
                  />
                </div>
              </div>

              {/* Quick Range Dropdown */}
              <div className="relative" ref={presetMenuRef}>
                <button
                  type="button"
                  ref={presetButtonRef}
                  className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-slate-800"
                  onClick={() => setPresetMenuOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={presetMenuOpen}
                >
                  <FilterGlyph className="h-4 w-4" />
                  Quick ranges
                  <span className="sr-only">Toggle date presets menu</span>
                </button>
                {presetMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-slate-900">
                    <div className="py-1">
                      {quickRangeOptions.map(({ label, preset }) => (
                        <button
                          key={preset}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
                          onClick={() => applyPreset(preset)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cards share the global date range above */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Created */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
                <p className="text-base font-bold text-gray-900 dark:text-white">Created</p>
                <div className="mt-4 rounded-xl bg-indigo-50 py-6 text-center text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                  <p className="text-3xl font-semibold">
                    {analyticsLoading && !analyticsSummary ? "--" : (analyticsSummary?.created ?? 0)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
                </div>
              </div>

              {/* Modified */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
                <p className="text-base font-bold text-gray-900 dark:text-white">Modified</p>
                <div className="mt-4 rounded-xl bg-violet-50 py-6 text-center text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                  <p className="text-3xl font-semibold">
                    {analyticsLoading && !analyticsSummary ? "--" : (analyticsSummary?.modified ?? 0)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
                </div>
              </div>

              {/* Booked */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
                <p className="text-base font-bold text-gray-900 dark:text-white">Booked</p>
                <div className="mt-4 rounded-xl bg-emerald-50 py-6 text-center text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <p className="text-3xl font-semibold">
                    {analyticsLoading && !analyticsSummary ? "--" : (analyticsSummary?.booked ?? 0)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
                </div>
              </div>

              {/* Lost */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
                <p className="text-base font-bold text-gray-900 dark:text-white">Lost</p>
                <div className="mt-4 rounded-xl bg-rose-50 py-6 text-center text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                  <p className="text-3xl font-semibold">
                    {analyticsLoading && !analyticsSummary ? "--" : (analyticsSummary?.lost ?? 0)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide">Accounts</p>
                </div>
              </div>
            </div>

            {/* Demos by Account Size */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-900">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white">Demos by Account Size</p>
                  </div>
                </div>
                <div className="pt-4 space-y-5">
                  {demoBuckets.map((bucket) => (
                    <div key={bucket.key} className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bucket.badgeBg} ${bucket.badgeText}`}>
                        <SizeBucketGlyph className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{bucket.label}</span>
                        <span className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{formatDemoCount(bucket.count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Placeholder column for future Recent Activity or other content */}
              <div className="hidden rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-400 shadow-sm dark:border-gray-800 dark:bg-slate-900 lg:block">
                <p>Recent activity or additional analytics can appear here in a future spec.</p>
              </div>
            </div>
          </div>

          {/* My Accounts list moved to dedicated /my-accounts page */}
        </div>
      </div>
    </div>
  );
}
