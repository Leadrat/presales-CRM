"use client";

import React from "react";

type RoleBadgeProps = {
  roleName?: string | null;
};

export function RoleBadge({ roleName }: RoleBadgeProps) {
  const role = (roleName || "").trim() || "Basic";
  const isAdmin = role.toLowerCase() === "admin";

  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const adminClasses = `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200`;
  const basicClasses = `${base} bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200`;

  return <span className={isAdmin ? adminClasses : basicClasses}>{isAdmin ? "Admin" : role}</span>;
}
