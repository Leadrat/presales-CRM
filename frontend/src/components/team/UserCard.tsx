"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Mail, Phone, User as UserIcon, MoreHorizontal, Pencil, UserX, Trash2, RotateCcw, Shield } from "lucide-react";
import type { TeamUser } from "@/lib/api";
import { updateUser, deleteUser } from "@/lib/api";
import { RoleBadge } from "./RoleBadge";
import { useAuth } from "@/context/AuthContext";

type UserCardProps = {
  user: TeamUser;
  onEdit?: (id: string) => void;
  onToggled?: () => void;
  onDeleted?: () => void;
  adminRoleId?: string | null;
  basicRoleId?: string | null;
};

export function UserCard({ user, onEdit, onToggled, onDeleted, adminRoleId, basicRoleId }: UserCardProps) {
  const name = user.fullName && user.fullName.trim().length > 0 ? user.fullName : user.email;
  const initials = React.useMemo(() => {
    const source = (user.fullName || user.email || "").trim();
    if (!source) return "?";
    const parts = source.split(/[\s@.]+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }, [user.fullName, user.email]);

  const isActive = !!user.isActive;

  const deactivatedDate = React.useMemo(() => {
    if (!user.deactivatedAt) return null;
    const d = new Date(user.deactivatedAt);
    if (Number.isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, [user.deactivatedAt]);

  const { user: me } = useAuth();
  const isAdmin = (me?.role || "Basic").toLowerCase() === "admin";

  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      className={`relative overflow-visible flex flex-col rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 ${
        menuOpen ? "z-[999]" : ""
      }`}
    >
      {/* Soft mask for inactive users (non-blocking) */}
      {!isActive && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-slate-100/70 dark:bg-white/5" />
      )}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white shadow-sm ${
            isActive ? "bg-blue-600" : "bg-gray-300 text-gray-700"
          }`}
        >
          {initials || <UserIcon className="h-6 w-6" />}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-base sm:text-lg font-semibold ${
                isActive ? "text-gray-900 dark:text-gray-50" : "text-gray-700 dark:text-gray-300"
              }`}
              title={name}
            >
              {name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <RoleBadge roleName={user.roleName} />
            {!isActive && (
              <span className="inline-flex items-center rounded-md bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                Inactive
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="ml-auto -mr-1">
            <button
              type="button"
              aria-label="Open user actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className={`mt-3 space-y-1 text-sm ${
          isActive ? "text-gray-600 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Mail className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 truncate">
            <Phone className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{user.phone}</span>
          </div>
        )}
        {!isActive && (
          <div className="pt-1 text-xs font-medium text-rose-500">
            {deactivatedDate ? `Deactivated on: ${deactivatedDate}` : "Deactivated"}
          </div>
        )}
      </div>
      {isAdmin && menuOpen && (
        <div
          className="absolute right-2 top-9 z-[1000] w-44 whitespace-nowrap rounded-lg border border-gray-200 bg-white py-1 text-left text-sm shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              setMenuOpen(false);
              onEdit?.(user.id);
            }}
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              const next = !user.isActive;
              const verb = next ? "Activate" : "Deactivate";
              if (typeof window !== "undefined") {
                const ok = window.confirm(`${verb} this user?`);
                if (!ok) return;
              }
              try {
                setBusy(true);
                await updateUser(user.id, { isActive: next });
                onToggled?.();
              } catch (e) {
                // no-op for now
              } finally {
                setBusy(false);
                setMenuOpen(false);
              }
            }}
          >
            {busy ? <RotateCcw className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
            <span>{user.isActive ? "Deactivate" : "Activate"}</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              if (typeof window !== "undefined") {
                const ok = window.confirm("Delete this user? This cannot be easily undone.");
                if (!ok) return;
              }
              try {
                setBusy(true);
                await deleteUser(user.id);
                onDeleted?.();
              } catch (e) {
                // ignore for now
              } finally {
                setBusy(false);
                setMenuOpen(false);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
