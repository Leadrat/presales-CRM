"use client";

import React from "react";
import type { AccountActivityEntry } from "@/lib/api";

type ActivityLogListProps = {
  entries: AccountActivityEntry[];
};

function getEventLabel(eventType?: string | null): string {
  if (!eventType) return "Activity";
  const code = eventType.toUpperCase();

  switch (code) {
    case "DEAL_STAGE_CHANGED":
      return "Deal stage changed";
    case "LEAD_SOURCE_CHANGED":
      return "Lead source changed";
    case "DECISION_MAKERS_CHANGED":
      return "Decision makers updated";
    case "CONTACT_ADDED":
      return "Contact added";
    case "CONTACT_UPDATED":
      return "Contact updated";
    case "CONTACT_DELETED":
      return "Contact removed";
    case "DEMO_SCHEDULED":
      return "Demo scheduled";
    case "DEMO_UPDATED":
      return "Demo updated";
    case "DEMO_COMPLETED":
      return "Demo completed";
    case "DEMO_CANCELLED":
      return "Demo cancelled";
    default:
      return eventType;
  }
}

function getEventCategory(eventType?: string | null): "pipeline" | "contact" | "demo" | "other" {
  if (!eventType) return "other";
  const code = eventType.toUpperCase();

  if (code === "DEAL_STAGE_CHANGED" || code === "LEAD_SOURCE_CHANGED" || code === "DECISION_MAKERS_CHANGED") {
    return "pipeline";
  }

  if (code.startsWith("CONTACT_")) {
    return "contact";
  }

  if (code.startsWith("DEMO_")) {
    return "demo";
  }

  return "other";
}

function getEventBadgeClasses(category: ReturnType<typeof getEventCategory>): string {
  switch (category) {
    case "pipeline":
      return "bg-blue-900/40 text-blue-200 border-blue-500/40";
    case "contact":
      return "bg-emerald-900/40 text-emerald-200 border-emerald-500/40";
    case "demo":
      return "bg-amber-900/40 text-amber-100 border-amber-500/40";
    default:
      return "bg-gray-800 text-gray-200 border-gray-600/60";
  }
}

function getEventCategoryLabel(category: ReturnType<typeof getEventCategory>): string {
  switch (category) {
    case "pipeline":
      return "Pipeline";
    case "contact":
      return "Contact";
    case "demo":
      return "Demo";
    default:
      return "Other";
  }
}

export function ActivityLogList({ entries }: ActivityLogListProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const label = getEventLabel(entry.eventType);
        const category = getEventCategory(entry.eventType);
        const badgeClasses = getEventBadgeClasses(category);
        const categoryLabel = getEventCategoryLabel(category);

        return (
          <div
            key={entry.id}
            className="rounded-lg border border-gray-800 bg-gray-900/70 p-3 shadow-sm text-sm dark:border-gray-700 dark:bg-gray-900/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {categoryLabel}
                  </span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  {entry.actorName || "System"}
                </span>
              </div>
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-400">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-gray-200 dark:text-gray-100">{entry.description}</p>
          </div>
        );
      })}
    </div>
  );
}
