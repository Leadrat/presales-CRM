"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import DateTimePicker from "@/components/form/date-time-picker";

export type ContactInput = {
  name: string;
  email: string;
  workPhone: string;
  personalPhone: string;
  designation: string;
  city: string;
  dateOfBirth: string;
  instagramUrl: string;
  linkedinUrl: string;
};

interface CollapsibleContactProps {
  contact: ContactInput;
  index: number;
  disabled?: boolean;
  onChange: (updated: ContactInput) => void;
  onRemove: () => void;
}

export function CollapsibleContact({
  contact,
  index,
  disabled,
  onChange,
  onRemove,
}: CollapsibleContactProps) {
  const [open, setOpen] = useState(false);

  const handleFieldChange = (field: keyof ContactInput, value: string) => {
    onChange({ ...contact, [field]: value });
  };

  const hasName = contact.name?.trim().length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 sm:p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-slate-950/60 dark:text-gray-100 dark:hover:bg-gray-900"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {contact.name?.trim().length ? contact.name : `Contact #${index + 1}`}
          </span>
          {contact.designation && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{contact.designation}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-gray-500">
            {open ? "Hide" : "Show"}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3 dark:border-gray-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-200">Contact #{index + 1}</p>
            <button
              type="button"
              className="text-xs text-red-500 hover:text-red-400"
              onClick={onRemove}
              disabled={disabled}
            >
              Remove
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Work phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.workPhone}
                onChange={(e) => handleFieldChange("workPhone", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Personal phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.personalPhone}
                onChange={(e) => handleFieldChange("personalPhone", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Designation</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.designation}
                onChange={(e) => handleFieldChange("designation", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">City</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Date of birth</label>
              <DateTimePicker
                id={`contact-${index}-dob`}
                value={contact.dateOfBirth}
                onChange={(val) => handleFieldChange("dateOfBirth", val)}
                placeholder="Select date of birth"
                enableTime={false}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Instagram URL</label>
              <input
                type="url"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.instagramUrl}
                onChange={(e) => handleFieldChange("instagramUrl", e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">LinkedIn URL</label>
              <input
                type="url"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                value={contact.linkedinUrl}
                onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
