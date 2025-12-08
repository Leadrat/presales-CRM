import React, { useState, useEffect } from "react";

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

/**
 * A phone number input component that automatically adds the +91 prefix for Indian phone numbers.
 */
const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  placeholder = "Phone number",
  className = "",
  disabled = false,
  required = false,
  name,
  id,
}) => {
  // Initialize with +91 prefix if value is empty
  const formattedInitialValue = value ? (value.startsWith("+91") ? value : `+91${value.replace(/^\+91/, "")}`) : "+91";
  const [inputValue, setInputValue] = useState<string>(formattedInitialValue);
  
  // Update input value when the prop value changes
  useEffect(() => {
    if (!value) {
      setInputValue("+91");
    } else if (value.startsWith("+91")) {
      setInputValue(value);
    } else {
      setInputValue(`+91${value.replace(/^\+91/, "")}`);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Always ensure the +91 prefix
    if (newValue === "") {
      newValue = "+91";
    } else if (!newValue.startsWith("+91")) {
      newValue = `+91${newValue.replace(/^\+91/, "")}`;  
    }
    
    // Don't allow editing the +91 prefix
    if (newValue.length < 3) {
      newValue = "+91";
    }
    
    setInputValue(newValue);
    onChange(newValue);
  };

  // Default input styling from the application
  const defaultClassName = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:bg-gray-900";

  return (
    <div className="relative">
      <input
        type="tel"
        className={`${defaultClassName} ${className}`}
        value={inputValue}
        onChange={handleChange}
        placeholder="+91 XXXXXXXXXX"
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        // Add pattern for validation if needed
        // pattern="\\+91[0-9]{10}"
      />
    </div>
  );
};

export default PhoneNumberInput;
