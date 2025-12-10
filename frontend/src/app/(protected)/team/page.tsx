"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import type { TeamUser, TeamUsersPage, RoleOption } from "@/lib/api";
import { getTeamUsers, getUserRoles } from "@/lib/api";
import { UserCard } from "@/components/team/UserCard";
import EditUserModal from "@/components/team/EditUserModal";

const DEFAULT_PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: "all" | "active" | "inactive"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function TeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = (searchParams.get("status") as "all" | "active" | "inactive" | null) || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [status, setStatus] = useState<"all" | "active" | "inactive">(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<TeamUsersPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [adminRoleId, setAdminRoleId] = useState<string | null>(null);
  const [basicRoleId, setBasicRoleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getTeamUsers({ status, page, pageSize: DEFAULT_PAGE_SIZE });
        if (cancelled) return;
        setData(res);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load team users");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [status, page, refreshKey]);

  // Load roles for quick role actions
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getUserRoles();
        if (cancelled) return;
        setRoles(list);
        const admin = list.find((r) => r.name.toLowerCase() === "admin");
        const basic = list.find((r) => r.name.toLowerCase() === "basic");
        setAdminRoleId(admin ? admin.id : null);
        setBasicRoleId(basic ? basic.id : null);
      } catch {
        // ignore; quick actions will be hidden if roles not loaded
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalCount = data?.totalCount ?? 0;
  const pageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const items: TeamUser[] = useMemo(() => data?.items ?? [], [data]);

  const updateUrl = (nextStatus: "all" | "active" | "inactive", nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextStatus);
    params.set("page", String(nextPage));
    router.push(`/team?${params.toString()}`);
  };

  const handleStatusChange = (nextStatus: "all" | "active" | "inactive") => {
    if (nextStatus === status) return;
    setStatus(nextStatus);
    setPage(1);
    updateUrl(nextStatus, 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    updateUrl(status, nextPage);
  };

  const showingRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingRangeEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="space-y-1.5">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">Team Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage team members and assign roles.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1 text-xs font-medium shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className={`flex items-center rounded-md px-3 py-1 transition text-xs ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              {totalCount === 0
                ? "No users to display"
                : `${showingRangeStart}-${showingRangeEnd} of ${totalCount} users`}
            </p>
          </div>
        </div>

        {loading && (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading team users...
          </div>
        )}

        {!loading && error && (
          <div className="py-8 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-600 dark:text-gray-400">
            No users found for this filter.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={(id) => {
                    setEditingUserId(id);
                    setEditOpen(true);
                  }}
                  onToggled={() => setRefreshKey((k) => k + 1)}
                  onDeleted={() => setRefreshKey((k) => k + 1)}
                  adminRoleId={adminRoleId}
                  basicRoleId={basicRoleId}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <EditUserModal
        open={editOpen}
        userId={editingUserId}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
