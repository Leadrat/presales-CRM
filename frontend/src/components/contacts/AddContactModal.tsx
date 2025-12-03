"use client";

import { useEffect, useState } from "react";
import DateTimePicker from "@/components/form/date-time-picker";
import { createContact, type ContactCreateInput } from "@/lib/api";

interface AddContactModalProps {
  accountId?: string;
  open: boolean;
  onClose: () => void;
  onContactAdded?: () => void;
  onCreated?: (contact: ContactCreateInput) => void;
}

const emptyForm = {
  name: "",
  designation: "",
  personalPhone: "",
  workPhone: "",
  personalEmail: "",
  workEmail: "",
  city: "",
  dob: "",
  instagramUrl: "",
  linkedinUrl: "",
  notes: "",
};

export function AddContactModal({ accountId, open, onClose, onContactAdded, onCreated }: AddContactModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: ContactCreateInput = {
        name: form.name.trim(),
        designation: form.designation.trim() || undefined,
        personalPhone: form.personalPhone.trim() || undefined,
        workPhone: form.workPhone.trim() || undefined,
        email: form.workEmail.trim() || form.personalEmail.trim() || undefined,
        city: form.city.trim() || undefined,
        dateOfBirth: form.dob || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (accountId) {
        await createContact(accountId, payload);
        if (onContactAdded) onContactAdded();
      } else if (onCreated) {
        onCreated(payload);
      }

      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = "mb-1 text-sm font-medium text-gray-700";
  const inputClass =
    "block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Add Contact Person</h2>
            <button
              type="button"
              className="text-xl leading-none text-gray-500 hover:text-gray-700"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  disabled={submitting}
                  placeholder="Name *"
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.designation}
                  onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                  disabled={submitting}
                  placeholder="Owner"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Personal Phone</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={form.personalPhone}
                  onChange={(e) => setForm((p) => ({ ...p, personalPhone: e.target.value }))}
                  disabled={submitting}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
              <div>
                <label className={labelClass}>Work Phone</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={form.workPhone}
                  onChange={(e) => setForm((p) => ({ ...p, workPhone: e.target.value }))}
                  disabled={submitting}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Personal Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.personalEmail}
                  onChange={(e) => setForm((p) => ({ ...p, personalEmail: e.target.value }))}
                  disabled={submitting}
                  placeholder="name@gmail.com"
                />
              </div>
              <div>
                <label className={labelClass}>Work Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.workEmail}
                  onChange={(e) => setForm((p) => ({ ...p, workEmail: e.target.value }))}
                  disabled={submitting}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  disabled={submitting}
                  placeholder="City"
                />
              </div>
              <div>
                <DateTimePicker
                  id="contact-dob-picker"
                  label={<span className={labelClass}>Date of Birth</span>}
                  value={form.dob || undefined}
                  onChange={(val) => setForm((p) => ({ ...p, dob: val }))}
                  enableTime={false}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Instagram URL</label>
                <input
                  type="url"
                  className={inputClass}
                  value={form.instagramUrl}
                  onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))}
                  disabled={submitting}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className={labelClass}>LinkedIn URL</label>
                <input
                  type="url"
                  className={inputClass}
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
                  disabled={submitting}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                disabled={submitting}
                placeholder="Add any notes about this contact..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
