"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Save } from "lucide-react";
import { listAccounts, softDeleteAccount, type AccountDto } from "@/lib/api";

export default function AdminAccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; direction: "up" | "down" } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listAccounts();
        if (cancelled) return;
        setAccounts(data);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load accounts");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close actions popup on outside click or scroll
  useEffect(() => {
    if (!actionMenuId) return;
    const close = () => setActionMenuId(null);
    document.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [actionMenuId]);

  useEffect(() => {
    if (!actionMenuId) setMenuPos(null);
  }, [actionMenuId]);

  // Derived pagination values
  const totalItems = accounts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pagedAccounts = accounts.slice(start, end);

  const dealStageBadgeClass = (code?: string | null) => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    switch ((code || "").toUpperCase()) {
      case "NEW_LEAD":
        return `${base} bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300`;
      case "CONTACTED":
        return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
      case "QUALIFIED":
        return `${base} bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300`;
      case "IN_PROGRESS":
        return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`;
      case "WON":
        return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`;
      case "LOST":
        return `${base} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`;
      default:
        return `${base} bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300`;
    }
  };

  const formatDealStage = (code?: string | null) => {
    if (!code) return "";
    switch (code.toUpperCase()) {
      case "NEW_LEAD":
        return "New Lead";
      case "CONTACTED":
        return "Contacted";
      case "QUALIFIED":
        return "Qualified";
      case "IN_PROGRESS":
        return "In Progress";
      case "WON":
        return "Won";
      case "LOST":
        return "Lost";
      default:
        return code
          .toLowerCase()
          .split(/[_\s-]+/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");
    }
  };

  // UI-only account size label from number of users (Admin list)
  // Logic: 4-9 Little, 10-24 Small, 25-49 Medium, 50+ Enterprise
  const computeSizeLabel = (users?: number | null) => {
    if (typeof users !== "number" || !Number.isFinite(users) || users < 4) return "";
    if (users <= 9) return "Little";
    if (users <= 24) return "Small";
    if (users <= 49) return "Medium";
    return "Enterprise";
  };

  const sizeBadgeClass = (label: string) => {
    const base = "inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold leading-none";
    if (label === "Little") return `${base} border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/25 dark:text-cyan-300`;
    if (label === "Small") return `${base} border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/25 dark:text-green-300`;
    if (label === "Medium") return `${base} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-300`;
    if (label === "Enterprise") return `${base} border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/25 dark:text-purple-300`;
    return "text-gray-400";
  };

  const handleOpen = (id: string) => {
    router.push(`/accounts/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/accounts/${id}?edit=1`);
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to delete this account? This action cannot be easily undone."
      );
      if (!confirmed) {
        return;
      }
    }

    if (deletingId) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      await softDeleteAccount(id);
      setAccounts((prev) => prev.filter((account) => account.id !== id));
    } catch (e: any) {
      setDeleteError(e?.message || "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">Accounts</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                onClick={() => typeof window !== 'undefined' && window.alert && window.alert('Export coming soon')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 12 4-4m-4 4-4-4M4 20h16"/></svg>
                <span>Export</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
                onClick={() => router.push("/accounts/new")}
              >
                <Save className="h-4 w-4" />
                <span>New Account</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{`${Math.min(end, totalItems) === 0 ? 0 : start + 1}-${Math.min(end, totalItems)} of ${totalItems} accounts`}</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by company name, phone, email, or contact numbers..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                disabled
              />
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.5 3.5a5 5 0 013.9 8.1l3.25 3.25a.75.75 0 11-1.06 1.06l-3.25-3.25A5 5 0 118.5 3.5zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" clipRule="evenodd"/></svg>
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              disabled
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 10h12M9 15h6M10 20l2-2 2 2"/></svg>
              <span>Advanced Filters</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.18l3.71-3.95a.75.75 0 111.08 1.04l-4.25 4.52a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
            </button>
          </div>
        </div>

        {/* States and table card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
          {deleteError && (
            <div className="px-4 py-3 sm:px-6">
              <p className="text-xs text-red-500 dark:text-red-400">{deleteError}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 sm:px-6">Loading accounts...</div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="px-4 py-6 text-sm text-red-600 dark:text-red-400 sm:px-6">{error}</div>
          )}

          {/* Empty state */}
          {!loading && !error && accounts.length === 0 && (
            <div className="px-4 py-10 text-center sm:px-6">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No accounts yet</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Once you or your team add accounts, they will appear here with quick access
                to their details.
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && accounts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-slate-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-500 dark:text-gray-400">
                      Company Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-400">
                      Account Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-400">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-400">
                      City
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-400">
                      Deal Stage
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-400">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium tracking-wider text-gray-400">
                      Created Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium tracking-wider text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950/60">
                  {pagedAccounts.map((account, idx) => (
                    <tr
                      key={account.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/80"
                      onClick={() => handleOpen(account.id)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {account.companyName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {account.accountTypeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          const label = computeSizeLabel((account as any).numberOfUsers);
                          return label ? (
                            <span className={sizeBadgeClass(label)}>{label}</span>
                          ) : (
                            account.accountSizeName || "-"
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {account.city || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {account.dealStage ? (
                          <span className={dealStageBadgeClass(account.dealStage)}>
                            {formatDealStage(account.dealStage)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {account.createdByUserDisplayName || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative px-4 py-3 text-right text-sm text-gray-400 dark:text-gray-600 overflow-visible">
                        <div className="relative inline-block text-left overflow-visible" onMouseDown={(e)=>e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Capture rect BEFORE any state updates
                              const btn = e.currentTarget as HTMLButtonElement | null;
                              const rect = btn ? btn.getBoundingClientRect() : null;
                              const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
                              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
                              const menuWidth = 144; // w-36
                              const menuHeight = 88; // approx height for two options
                              const gap = 8;

                              setActionMenuId((current) => (current === account.id ? null : account.id));

                              if (rect) {
                                const openDown = viewportHeight - rect.bottom > menuHeight + gap;
                                const maxLeft = viewportWidth - menuWidth - 8;
                                const left = Math.max(8, Math.min(maxLeft, rect.right - menuWidth));
                                const top = openDown ? rect.bottom + gap : rect.top - gap - menuHeight;
                                setMenuPos({ top, left, direction: openDown ? "down" : "up" });
                              } else {
                                setMenuPos(null);
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {actionMenuId === account.id && menuPos && (
                            <div
                              className="fixed z-[1000] w-36 whitespace-nowrap rounded-lg border border-gray-200 bg-white py-1 text-left text-sm shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900"
                              style={{ top: menuPos.top, left: menuPos.left }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuId(null);
                                  handleEdit(account.id);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                disabled={deletingId === account.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuId(null);
                                  void handleDelete(account.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{deletingId === account.id ? "Deleting..." : "Delete"}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination footer */}
          {!loading && !error && accounts.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Items per page:</span>
                <select
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={pageSize}
                  onChange={(e) => {
                    const size = parseInt(e.target.value, 10) || 10;
                    setPageSize(size);
                    setPage(1);
                  }}
                >
                  {[10, 15, 25, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                  const idx = i + 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPage(idx)}
                      className={`h-8 w-8 rounded-md text-sm font-medium ${
                        currentPage === idx
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {idx}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-1 text-sm text-gray-500">…</span>
                )}
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
