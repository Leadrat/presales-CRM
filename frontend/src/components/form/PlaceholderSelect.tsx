import React from "react";

interface Option {
  id: string;
  name: string;
  value?: string; // For compatibility with different data structures
}

interface PlaceholderSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  valueKey?: string; // Which property to use as the value (defaults to "id")
  labelKey?: string; // Which property to use as the label (defaults to "name")
}

/**
 * A select component that shows a placeholder when no option is selected.
 * The placeholder is shown as text in the select field when no option is selected.
 */
const PlaceholderSelect: React.FC<PlaceholderSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  name,
  id,
  valueKey = "id",
  labelKey = "name",
}) => {
  // Check if the value exists in the options
  const valueExists = options.some(option => option[valueKey as keyof Option] === value);
  // If value doesn't exist in options, treat it as empty
  const effectiveValue = valueExists ? value : "";
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  // Default select styling from the application
  const defaultClassName = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900";

  return (
    <div className="relative">
      <select
        className={`${defaultClassName} ${className}`}
        value={effectiveValue}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
      >
        <option value="" hidden></option>
        {options.map((option) => (
          <option 
            key={option[valueKey as keyof Option] as string} 
            value={option[valueKey as keyof Option] as string}
          >
            {option[labelKey as keyof Option] as string}
          </option>
        ))}
      </select>
      {!effectiveValue && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 dark:text-gray-500">
          {placeholder}
        </span>
      )}
    </div>
  );
};

export default PlaceholderSelect;
