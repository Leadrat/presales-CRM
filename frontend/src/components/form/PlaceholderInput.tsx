import React from "react";

interface PlaceholderInputProps {
  value: string | null | undefined;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  type?: string;
}

/**
 * An input component that shows a placeholder when the value is empty.
 * Particularly useful for disabled/read-only inputs that need to show placeholder text.
 */
const PlaceholderInput: React.FC<PlaceholderInputProps> = ({
  value,
  placeholder,
  className = "",
  disabled = true,
  type = "text",
}) => {
  // Default input styling from the application
  const defaultClassName = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900";

  const displayValue = value || "";

  return (
    <input
      type={type}
      className={`${defaultClassName} ${className}`}
      value={displayValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={disabled}
    />
  );
};

export default PlaceholderInput;
