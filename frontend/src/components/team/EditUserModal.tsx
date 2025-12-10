"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getUser, getUserRoles, type RoleOption, type UserDetail, updateUser } from "@/lib/api";

type Props = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onSaved?: (user: UserDetail) => void;
};

export default function EditUserModal({ open, userId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");

  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [detail, rolesList] = await Promise.all([getUser(userId as string), getUserRoles()]);
        if (cancelled) return;
        setFullName(detail.fullName || "");
        setPhone(detail.phone || "");
        setRoleId(detail.roleId || "");
        setRoles(rolesList);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const roleOptions = useMemo(() => {
    // Only allow Basic and Admin roles in the dropdown
    const allowed = roles.filter((r) => {
      const name = r.name.toLowerCase();
      return name === "basic" || name === "admin";
    });
    // Keep a stable order: Basic first, then Admin
    return allowed.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName === bName) return 0;
      if (aName === "basic") return -1;
      if (bName === "basic") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [roles]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Edit Team Member</h2>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!userId) return;
              setSaving(true);
              setError(null);
              try {
                const saved = await updateUser(userId as string, {
                  fullName: fullName,
                  phone: phone,
                  roleId: roleId || null,
                });
                onSaved?.(saved);
                onClose();
              } catch (err: any) {
                setError(err?.message || "Failed to save changes");
              } finally {
                setSaving(false);
              }
            }}
          >
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Full Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Phone Number</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91xxxxxxxxxx"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Role</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                {roleOptions.map((r) => {
                  const nameLower = r.name.toLowerCase();
                  const label = nameLower === "basic" ? "Basic" : "Admin";
                  return (
                    <option key={r.id} value={r.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
