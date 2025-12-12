"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserRound, Mail, Phone, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUser, getUserRoles, type RoleOption, type UserDetail, updateUser } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const role = user?.role ?? "-";
  const isAdmin = user?.role === "Admin";

  // Load user data and roles
  useEffect(() => {
    if (!user) return;
    if (!user.id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Store user ID to avoid null reference issues
        const userId = user!.id; // User is guaranteed to exist due to the check above
        const [detail, rolesList] = await Promise.all([getUser(userId), getUserRoles()]);
        if (cancelled) return;
        setFullName(detail.fullName || "");
        setPhone(detail.phone || "");
        setRoleId(detail.roleId || "");
        setRoles(rolesList);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const roleOptions = roles.filter((r) => {
    const name = r.name.toLowerCase();
    return name === "basic" || name === "admin";
  }).sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    if (aName === bName) return 0;
    if (aName === "basic") return -1;
    if (bName === "basic") return 1;
    return a.name.localeCompare(b.name);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        fullName: fullName,
        phone: phone,
      };

      // Only include roleId for Admin users
      if (isAdmin) {
        updateData.roleId = roleId || null;
      }

      const saved = await updateUser(user.id, updateData);
      
      // Update local auth context with new user data
      if (saved) {
        setUser({
          id: saved.id,
          email: saved.email,
          fullName: saved.fullName || undefined,
          role: user.role, // Keep existing role from auth context
        });
      }

      setSuccess("Profile updated successfully!");
      setEditing(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err?.status === 403) {
        setError("Permission denied: You don't have permission to edit profiles. Please contact your administrator.");
      } else {
        setError(err?.message || "Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user?.id) return;
    // Reset to original values
    setFullName(user.fullName || "");
    setPhone(""); // Reset to empty since user object doesn't have phone
    setRoleId(""); // Reset to empty since user object doesn't have roleId
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-gray-900 dark:bg-slate-950 dark:text-gray-100 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Profile</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage your account information and preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-8">
          {!editing ? (
            // View Mode - Same layout as Edit Mode but read-only
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  value={fullName && fullName.trim().length > 0 ? fullName : ""}
                  disabled
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  value={user?.email ?? ""}
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Email address cannot be changed</p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Phone Number</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  value={phone && phone.trim().length > 0 ? phone : ""}
                  disabled
                  readOnly
                />
              </div>

              {/* Role Field - Same for both Admin and Basic users in view mode */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Role</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  value={role}
                  disabled
                  readOnly
                />
                {!isAdmin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your role is managed by your administrator</p>
                )}
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  value={user?.email ?? ""}
                  disabled
                  placeholder="Email cannot be changed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Email address cannot be changed</p>
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

              {/* Role Field - Only for Admin users */}
              {isAdmin && (
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
              )}

              {/* Role Display for Basic Users (Read-only) */}
              {!isAdmin && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Role</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    value={role}
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your role is managed by your administrator</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  onClick={handleCancel}
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
    </div>
  );
}
