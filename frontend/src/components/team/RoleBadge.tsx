"use client";

import React from "react";
import { UserRound } from "lucide-react";

type RoleBadgeProps = {
  roleName?: string | null;
};

export function RoleBadge({ roleName }: RoleBadgeProps) {
  const role = (roleName || "").trim() || "Basic";
  const isAdmin = role.toLowerCase() === "admin";

  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";
  const adminClasses = `${base} bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200`;
  const basicClasses = `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200`;

  return (
    <span className={isAdmin ? adminClasses : basicClasses}>
      <UserRound className="h-3.5 w-3.5" />
      <span>{isAdmin ? "Admin" : role}</span>
    </span>
  );
}
