import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);
  const displayLabel = selectedOption ? selectedOption.label : label;

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm ${
          value ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        <span className="block truncate">{displayLabel}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between ${
                value === option.value ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;