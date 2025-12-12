"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardResponse, type LeaderboardUserRow } from "@/lib/api";
import { LeaderboardList } from "./LeaderboardList";

type PeriodKey = "weekly" | "monthly" | "quarterly";

function formatRangeLabel(period: PeriodKey, startDate: string, endDate: string): string {
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  const startOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const endOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

  const startLabel = start.toLocaleDateString(undefined, startOpts);
  const endLabel = end.toLocaleDateString(undefined, endOpts);

  if (period === "weekly") {
    return `Week of ${startLabel} - ${endLabel}`;
  }

  if (period === "monthly") {
    const monthLabel = start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    return `${monthLabel}`;
  }

  // Quarterly
  const month = start.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  const year = start.getFullYear();
  return `Q${quarter} ${year} (${start.toLocaleDateString(undefined, { month: "short" })} - ${end.toLocaleDateString(undefined, { month: "short" })})`;

}

const periodTabs: { key: PeriodKey; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<PeriodKey>("weekly");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getLeaderboard(period);
        if (cancelled) return;
        setData(response);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load leaderboard");
        setData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const rangeLabel = data ? formatRangeLabel(period, data.startDate, data.endDate) : null;
  const users: LeaderboardUserRow[] = data?.users ?? [];

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-gray-900 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-600">
            Track top performers across different time periods.
          </p>
        </div>

        {/* Period tabs */}
        <div className="bg-gray-50 p-1 rounded-md">
          <div className="grid grid-cols-3 gap-1 text-sm">
            {periodTabs.map((tab) => {
              const isActive = tab.key === period;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPeriod(tab.key)}
                  className={`px-3 py-2 transition-colors rounded-md ${
                    isActive
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range */}
        {rangeLabel && (
          <div className="text-sm text-gray-600 font-medium bg-white p-3 rounded-md shadow-sm">
            {rangeLabel}
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {loading && (
            <div className="space-y-3">
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-medium">Failed to load leaderboard</p>
              <p className="mt-0.5 text-xs">{error}</p>
              <button
                type="button"
                onClick={() => setPeriod((p) => p)}
                className="mt-2 text-xs font-medium text-red-700 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && <LeaderboardList users={users} />}
        </div>

        {/* Scoring system */}
        <div className="mt-4 rounded-lg bg-sky-50 px-4 py-5 text-sm text-gray-700">
          <p className="text-sm font-semibold text-gray-900">Scoring System</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• New Account Created: 2 points</li>
            <li>• Demo Completed (Small Account): 2 points</li>
            <li>• Demo Completed (Medium Account): 3 points</li>
            <li>• Demo Completed (Enterprise Account): 5 points</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            *Demo breakdown shows count by account size<br />
            *Points awarded to the user who scheduled the demo<br />
            *Only users with at least 1 account created or 1 demo completed are shown
          </p>
        </div>
      </div>
    </div>
  );
}
