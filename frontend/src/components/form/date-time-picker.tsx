"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import flatpickr from "flatpickr";
import type { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";

interface DateTimePickerProps {
  id: string;
  label?: ReactNode;
  /**
   * Current value as a date/time string. This should match the configured dateFormat.
   * For example: "2025-11-24" or "2025-11-24T18:30".
   */
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Enable time selection in addition to date. Defaults to true. */
  enableTime?: boolean;
  /** Optional custom date format. Falls back to date-only or datetime format. */
  dateFormat?: string;
  disabled?: boolean;
}

export default function DateTimePicker({
  id,
  label,
  value,
  onChange,
  placeholder,
  enableTime = true,
  dateFormat,
  disabled,
}: DateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const calendarPortalRef = useRef<HTMLDivElement | null>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<string>("");
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [calendarPortal, setCalendarPortal] = useState<HTMLDivElement | null>(null);

  const resolvedFormat = dateFormat || (enableTime ? "Y-m-d\\TH:i" : "Y-m-d");

  // Create and manage a portal container for the calendar
  useEffect(() => {
    if (typeof window === "undefined") return;
    let portal = document.getElementById("flatpickr-calendar-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "flatpickr-calendar-portal";
      portal.style.position = "fixed";
      portal.style.top = "0";
      portal.style.left = "0";
      portal.style.zIndex = "9999";
      // Allow pointer events so backdrop and buttons work
      document.body.appendChild(portal);
    }
    setCalendarPortal(portal as HTMLDivElement);
    return () => {
      // Do not remove the portal; it may be shared by multiple pickers
    };
  }, []);

  const applyCalendarTheme = (instance: FlatpickrInstance | null) => {
    if (!instance) return;
    const container = instance.calendarContainer as HTMLElement | undefined;
    if (!container) return;

    try {
      const textSelectors = [
        ".flatpickr-current-month",
        ".flatpickr-current-month .flatpickr-monthDropdown-months",
        ".flatpickr-weekday",
        ".flatpickr-day",
      ];
      textSelectors.forEach((selector) => {
        container.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          el.style.color = "#e5e7eb"; // light gray
        });
      });

      // Ensure the year is fully visible and same color as month
      container.querySelectorAll<HTMLElement>(".flatpickr-current-month .cur-year").forEach((yearEl) => {
        yearEl.style.setProperty("color", "#e5e7eb", "important");
        yearEl.style.setProperty("opacity", "1", "important");
      });

      container.querySelectorAll<HTMLInputElement>(".numInput.cur-year").forEach((yearInput) => {
        yearInput.style.setProperty("color", "#e5e7eb", "important");
        yearInput.style.background = "transparent";
        yearInput.style.borderColor = "transparent";
      });
    } catch {
      // best-effort styling
    }
  };

  // Initialize flatpickr when calendar opens
  useEffect(() => {
    if (!isOpen || !calendarRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!calendarRef.current) return;

      const instance = flatpickr(calendarRef.current, {
        enableTime,
        dateFormat: resolvedFormat,
        defaultDate: value || new Date(),
        time_24hr: false,
        inline: true,
        onReady: (selectedDates, dateStr, fp) => {
          applyCalendarTheme(fp);
        },
        onMonthChange: (selectedDates, dateStr, fp) => {
          applyCalendarTheme(fp);
        },
        onYearChange: (selectedDates, dateStr, fp) => {
          applyCalendarTheme(fp);
        },
        onChange: (_selectedDates, dateStr) => {
          setPendingValue(dateStr);
        },
      });

      fpRef.current = instance;
    }, 10);

    return () => {
      clearTimeout(timer);
      if (fpRef.current && typeof fpRef.current.destroy === "function") {
        fpRef.current.destroy();
      }
      fpRef.current = null;
    };
  }, [isOpen, enableTime, resolvedFormat, value]);

  const openWithPosition = () => {
    if (disabled) return;
    if (!inputRef.current || typeof window === "undefined") {
      setIsOpen(true);
      return;
    }

    const rect = inputRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Approximate calendar size
    const calendarWidth = 320;
    const calendarHeight = enableTime ? 420 : 360;

    let top = rect.bottom + 8;
    let left = rect.left;

    // If it would overflow bottom, show above the input instead
    if (top + calendarHeight > viewportHeight - 8) {
      top = rect.top - calendarHeight - 8;
    }

    // Clamp vertically fully into viewport (fixes overflow above top)
    const maxTop = Math.max(8, viewportHeight - calendarHeight - 8);
    if (top < 8) top = 8;
    if (top > maxTop) top = maxTop;

    // Clamp horizontally into viewport
    if (left + calendarWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - calendarWidth - 8);
    }

    setPopupPosition({ top, left });
    setIsOpen(true);
  };

  // Sync display value from external value
  useEffect(() => {
    if (value) {
      setDisplayValue(value);
      setPendingValue(value);
    }
  }, [value]);

  const handleCancel = () => {
    // Reset to original value
    if (fpRef.current && value) {
      fpRef.current.setDate(value, false);
    }
    setPendingValue(value || "");
    setIsOpen(false);
  };

  const handleSet = () => {
    if (pendingValue && onChange) {
      onChange(pendingValue);
      setDisplayValue(pendingValue);
    }
    setIsOpen(false);
  };

  // Format display value for input
  const formatDisplayValue = (val: string) => {
    if (!val) return "";
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      if (enableTime) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      }
      return `${day}-${month}-${year}`;
    } catch {
      return val;
    }
  };

  return (
    <div className="relative">
      {label && (
        <Label htmlFor={id}>
          {label}
        </Label>
      )}
      <div className="relative mt-1">
        <input
          id={id}
          ref={inputRef}
          placeholder={placeholder}
          disabled={disabled}
          value={formatDisplayValue(displayValue)}
          onClick={openWithPosition}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800 cursor-pointer"
          readOnly
        />
        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-5" />
        </span>
      </div>

      {/* Calendar Popup - rendered in a portal to escape modal overflow */}
      {isOpen && calendarPortal && createPortal(
        <div className="fixed z-50" style={{ top: popupPosition.top, left: popupPosition.left }}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCancel}
          />
          {/* Calendar Container */}
          <div
            className="relative z-50 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#e5e7eb" }}
          >
            {/* Flatpickr inline calendar */}
            <div ref={calendarRef} className="flatpickr-dark-theme" />
            
            {/* Cancel / Set buttons */}
            <div className="flex justify-between items-center px-4 py-3" style={{ borderTop: "1px solid #334155" }}>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                style={{ color: "#94a3b8" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSet}
                className="px-6 py-1.5 text-sm font-medium rounded-md transition-colors"
                style={{ color: "#5eead4" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#99f6e4")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#5eead4")}
              >
                Set
              </button>
            </div>
          </div>
        </div>,
        calendarPortal
      )}
    </div>
  );
}

