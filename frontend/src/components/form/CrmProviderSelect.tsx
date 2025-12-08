import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getAccountLookups } from "@/lib/api";
import { Plus } from "lucide-react";

// Helper function to highlight matching text parts
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  if (!lowerText.includes(lowerQuery)) return text;
  
  const startIndex = lowerText.indexOf(lowerQuery);
  const endIndex = startIndex + lowerQuery.length;
  
  return (
    <>
      {text.substring(0, startIndex)}
      <span className="font-medium text-brand-600 dark:text-brand-400">
        {text.substring(startIndex, endIndex)}
      </span>
      {text.substring(endIndex)}
    </>
  );
}

export interface CrmProviderOption {
  id: string;
  name: string;
}

export interface CrmProviderSelectValue {
  providerId: string | null; // existing CRM id, if any
  providerName: string; // typed CRM name (used when id is null)
}

interface CrmProviderSelectProps {
  options: CrmProviderOption[];
  valueId: string; // currently selected provider id ("" when none)
  valueName: string; // current free-text name when not in list ("" when none)
  onChange: (value: CrmProviderSelectValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  /**
   * Called when options should be refreshed (e.g., after creating a new CRM provider)
   * If not provided, component will use internal getAccountLookups to refresh
   */
  onRefreshOptions?: () => Promise<CrmProviderOption[]>;
}

/**
 * Searchable + free-text CRM provider selector.
 * - User can pick from existing options.
 * - User can type to filter options.
 * - User can type a new CRM name that isn't in the list.
 *
 * Emits either a known provider id (and clears providerName) or a free-text providerName with null id.
 */
const CrmProviderSelect: React.FC<CrmProviderSelectProps> = ({
  options,
  valueId,
  valueName,
  onChange,
  placeholder = "Select or type CRM provider",
  className = "",
  disabled = false,
  required = false,
  name,
  id,
  onRefreshOptions,
}) => {
  // Determine the initial text shown in the input
  const initialText = useMemo(() => {
    if (valueId) {
      const match = options.find((o) => o.id === valueId);
      if (match) {
        // Don't show "None" or "None/Unknown" as initial text
        if (match.name === "None" || match.name === "None/Unknown") {
          return "";
        }
        return match.name;
      }
    }
    // Only use valueName if it's not "None" or "None/Unknown"
    if (valueName && valueName !== "None" && valueName !== "None/Unknown") {
      return valueName;
    }
    return "";
  }, [options, valueId, valueName]);

  const [inputValue, setInputValue] = useState(initialText);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [localOptions, setLocalOptions] = useState<CrmProviderOption[]>(options);
  
  // Refresh options from the server - used when a new CRM provider is created
  const refreshOptions = useCallback(async () => {
    try {
      if (onRefreshOptions) {
        const updatedOptions = await onRefreshOptions();
        // Filter out "None" and "None/Unknown" from the dropdown options
        const filteredOptions = updatedOptions.filter(
          (o) => o.name !== "None" && o.name !== "None/Unknown"
        );
        setLocalOptions(filteredOptions);
        return filteredOptions;
      } else {
        // Default implementation using API
        const lookups = await getAccountLookups();
        // Filter out "None" and "None/Unknown" from the dropdown options
        const filteredOptions = lookups.crmProviders.filter(
          (o) => o.name !== "None" && o.name !== "None/Unknown"
        );
        setLocalOptions(filteredOptions);
        return filteredOptions;
      }
    } catch (error) {
      console.error("Failed to refresh CRM providers:", error);
      return localOptions;
    }
  }, [onRefreshOptions, localOptions]);

  // Keep inputValue in sync when external value changes
  useEffect(() => {
    setInputValue(initialText);
  }, [initialText]);
  
  // Keep local options in sync with provided options
  useEffect(() => {
    // Filter out "None" and "None/Unknown" from the dropdown options
    const filteredOptions = options.filter(
      (o) => o.name !== "None" && o.name !== "None/Unknown"
    );
    setLocalOptions(filteredOptions);
  }, [options]);

  const filteredOptions = useMemo(() => {
    const term = inputValue.trim().toLowerCase();
    if (!term) return localOptions;
    // Return all options that contain the search term
    return localOptions.filter((o) => o.name.toLowerCase().includes(term));
  }, [inputValue, localOptions]);

  const handleSelectOption = (option: CrmProviderOption) => {
    // Don't select "None" or "None/Unknown" options
    if (option.name === "None" || option.name === "None/Unknown") {
      setInputValue("");
      setIsOpen(false);
      setIsCreatingNew(false);
      onChange({ providerId: null, providerName: "" });
      return;
    }
    
    setInputValue(option.name);
    setIsOpen(false);
    setIsCreatingNew(false);
    onChange({ providerId: option.id, providerName: "" });
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setIsOpen(true);

    const trimmed = text.trim();
    if (!trimmed) {
      // Nothing typed: clear both id and name
      onChange({ providerId: null, providerName: "" });
      setIsCreatingNew(false);
      return;
    }

    // Skip "None" or "None/Unknown" values
    if (trimmed.toLowerCase() === "none" || trimmed.toLowerCase() === "none/unknown") {
      onChange({ providerId: null, providerName: "" });
      setIsCreatingNew(false);
      return;
    }

    // Check if the text exactly matches an existing option (case-insensitive)
    const exact = localOptions.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());
    
    // Check if there are any partial matches
    const partialMatches = localOptions.filter((o) => 
      o.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    
    if (exact) {
      // Exact match found - select it
      onChange({ providerId: exact.id, providerName: "" });
      setIsCreatingNew(false);
    } else if (partialMatches.length > 0) {
      // Partial matches found - show as creating new but keep dropdown open
      onChange({ providerId: null, providerName: trimmed });
      setIsCreatingNew(true);
    } else {
      // No matches - creating new
      onChange({ providerId: null, providerName: trimmed });
      setIsCreatingNew(true);
    }
  };

  const handleBlur = () => {
    // Close the dropdown shortly after blur to allow click selection
    setTimeout(() => setIsOpen(false), 100);
    
    // If we have a new CRM name typed, refresh options when focus is lost
    // This helps ensure the dropdown is updated after a form submission
    if (isCreatingNew && inputValue.trim()) {
      setTimeout(() => refreshOptions(), 500);
    }
  };

  const defaultClassName =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 " +
    "focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 " +
    "dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900";

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          className={`${defaultClassName} ${className} ${isCreatingNew ? 'pr-8' : ''}`}
          value={inputValue}
          onChange={handleChangeInput}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          name={name}
          id={id}
          autoComplete="off"
        />
        {isCreatingNew && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400">
            <Plus size={16} />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {isCreatingNew && inputValue.trim() && (
            <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-green-600 dark:border-gray-700 dark:bg-gray-800 dark:text-green-400">
              <span className="flex items-center gap-1">
                <Plus size={14} />
                Create new CRM: "{inputValue.trim()}"
              </span>
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="flex w-full items-center px-3 py-1.5 text-left text-sm text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                  onMouseDown={(e) => {
                    // Prevent input blur before click handler runs
                    e.preventDefault();
                  }}
                  onClick={() => handleSelectOption(option)}
                >
                  {/* Highlight the matching part of the text */}
                  {highlightMatch(option.name, inputValue.trim())}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No matching CRM providers
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmProviderSelect;
