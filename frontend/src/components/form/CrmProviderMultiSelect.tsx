import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getAccountLookups } from "@/lib/api";
import { Plus, X } from "lucide-react";

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

export interface CrmProviderMultiValue {
  providers: Array<{
    id: string | null; // existing CRM id, if any
    name: string; // CRM name
  }>;
}

interface CrmProviderMultiSelectProps {
  options: CrmProviderOption[];
  values: Array<{
    id: string | null; // currently selected provider ids or null for new ones
    name: string; // currently selected provider names
  }>;
  onChange: (value: CrmProviderMultiValue) => void;
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
 * Multi-select searchable + free-text CRM provider selector.
 * - User can pick multiple options from existing options.
 * - User can type to filter options.
 * - User can type new CRM names that aren't in the list.
 * - Selected CRMs appear as pills with "×" buttons to remove them.
 */
const CrmProviderMultiSelect: React.FC<CrmProviderMultiSelectProps> = ({
  options,
  values = [],
  onChange,
  placeholder = "Select or type CRM providers",
  className = "",
  disabled = false,
  required = false,
  name,
  id,
  onRefreshOptions,
}) => {
  const [inputValue, setInputValue] = useState("");
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
  
  // Keep local options in sync with provided options
  useEffect(() => {
    // Filter out "None" and "None/Unknown" from the dropdown options
    const filteredOptions = options.filter(
      (o) => o.name !== "None" && o.name !== "None/Unknown"
    );
    setLocalOptions(filteredOptions);
  }, [options]);

  // Filter options based on input and already selected values
  const filteredOptions = useMemo(() => {
    const term = inputValue.trim().toLowerCase();
    
    // Filter out options that are already selected
    const availableOptions = localOptions.filter(option => 
      !values.some(value => value.id === option.id)
    );
    
    if (!term) return availableOptions;
    
    // Return all options that contain the search term
    return availableOptions.filter((o) => o.name.toLowerCase().includes(term));
  }, [inputValue, localOptions, values]);

  const handleSelectOption = (option: CrmProviderOption) => {
    // Don't select "None" or "None/Unknown" options
    if (option.name === "None" || option.name === "None/Unknown") {
      return;
    }
    
    // Add the selected option to the values
    const newValues = [
      ...values,
      { id: option.id, name: option.name }
    ];
    
    onChange({ providers: newValues });
    setInputValue("");
    setIsCreatingNew(false);
  };

  const handleRemoveValue = (indexToRemove: number) => {
    const newValues = values.filter((_, index) => index !== indexToRemove);
    onChange({ providers: newValues });
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setIsOpen(true);

    const trimmed = text.trim();
    if (!trimmed) {
      setIsCreatingNew(false);
      return;
    }

    // Skip "None" or "None/Unknown" values
    if (trimmed.toLowerCase() === "none" || trimmed.toLowerCase() === "none/unknown") {
      setInputValue("");
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
      // Don't auto-select, just show it's available
      setIsCreatingNew(false);
    } else if (partialMatches.length > 0) {
      // Partial matches found - show as creating new but keep dropdown open
      setIsCreatingNew(true);
    } else {
      // No matches - creating new
      setIsCreatingNew(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      
      // Check if this is an existing option
      const exact = localOptions.find(
        (o) => o.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      
      if (exact) {
        // Add existing option
        handleSelectOption(exact);
      } else {
        // Add as new CRM
        const newValues = [
          ...values,
          { id: null, name: inputValue.trim() }
        ];
        onChange({ providers: newValues });
        setInputValue("");
      }
      
      setIsCreatingNew(false);
    }
  };

  const handleAddNewCrm = () => {
    if (!inputValue.trim()) return;
    
    // Add as new CRM
    const newValues = [
      ...values,
      { id: null, name: inputValue.trim() }
    ];
    onChange({ providers: newValues });
    setInputValue("");
    setIsCreatingNew(false);
    setIsOpen(false);
  };

  const handleBlur = () => {
    // Close the dropdown shortly after blur to allow click selection
    setTimeout(() => setIsOpen(false), 100);
    
    // If we have a new CRM name typed, refresh options when focus is lost
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
      {/* Selected values as pills */}
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <div 
              key={`${value.id || 'new'}-${index}`}
              className="flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
            >
              <span>{value.name}</span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-brand-200 dark:hover:bg-brand-800"
                onClick={() => handleRemoveValue(index)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          className={`${defaultClassName} ${className} ${isCreatingNew ? 'pr-8' : ''}`}
          value={inputValue}
          onChange={handleChangeInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={values.length > 0 ? "Add more CRMs..." : placeholder}
          disabled={disabled}
          required={required && values.length === 0}
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {isCreatingNew && inputValue.trim() && (
            <div 
              className="cursor-pointer border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-green-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700"
              onClick={handleAddNewCrm}
            >
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
                {inputValue.trim() ? "No matching CRM providers" : "No more CRM providers available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmProviderMultiSelect;
