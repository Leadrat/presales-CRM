import React from "react";
import { type LeaderboardUserRow } from "@/lib/api";
import { Trophy, Award, TrendingUp } from "lucide-react";
import { accountSizeBadgeClass } from "@/lib/account-utils";

interface LeaderboardListProps {
  users: LeaderboardUserRow[];
}

export function LeaderboardList({ users }: LeaderboardListProps) {
  if (users.length === 0) {
    return (
      <div className="empty-state rounded-lg border border-gray-100 bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
        No leaderboard data for this period yet. Once users create accounts or complete demos, they will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => {
        const rank = index + 1;
        const totalDemos = user.demos.small + user.demos.medium + user.demos.enterprise;
        const isTop1 = rank === 1;
        const isTop2 = rank === 2;
        const isTop3 = rank === 3;
        
        // Determine which icon to show based on rank
        let RankIcon = TrendingUp;
        let iconColor = "text-blue-500";
        
        if (isTop1) {
          RankIcon = Trophy;
          iconColor = "text-amber-500";
        } else if (isTop2) {
          RankIcon = Award;
          iconColor = "text-slate-400";
        } else if (isTop3) {
          RankIcon = Trophy;
          iconColor = "text-amber-700";
        }
        
        // Card background - very light blue for all cards
        const cardBg = "bg-sky-50";
        
        return (
          <div
            key={user.userId}
            className={`flex items-center justify-between rounded-lg px-4 py-4 ${cardBg} shadow-sm`}
            data-testid={isTop1 || isTop2 || isTop3 ? "top-rank" : "rank-badge"}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <RankIcon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Accounts: <span className="font-medium text-blue-600">{user.accountsCreated}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  Demos: <span className="font-medium text-blue-600">{totalDemos}</span>
                  {totalDemos > 0 && (
                    <span className="ml-2 inline-flex flex-wrap items-center gap-1 text-xs text-gray-500">
                      <span className={accountSizeBadgeClass("Small Account")}>
                        Small - {user.demos.small}
                      </span>
                      <span className={accountSizeBadgeClass("Medium Account")}>
                        Medium - {user.demos.medium}
                      </span>
                      <span className={accountSizeBadgeClass("Enterprise")}>
                        Enterprise - {user.demos.enterprise}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{user.points}</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
