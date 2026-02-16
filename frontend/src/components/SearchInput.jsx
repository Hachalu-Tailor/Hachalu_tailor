import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  onSearch,
  debounce = 300,
  className = '',
  suggestions = [],
  showSuggestions = false,
  onSuggestionClick,
  loading = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounce > 0) {
      debounceRef.current = setTimeout(() => {
        onChange?.(localValue);
        onSearch?.(localValue);
      }, debounce);
      
      return () => clearTimeout(debounceRef.current);
    } else {
      onChange?.(localValue);
      onSearch?.(localValue);
    }
  }, [localValue, debounce]);

  const handleInputChange = (e) => {
    setLocalValue(e.target.value);
    setShowDropdown(true);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion.label || suggestion);
    onChange?.(suggestion.label || suggestion);
    onSuggestionClick?.(suggestion);
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <HiOutlineMagnifyingGlass 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
          size={18} 
        />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className="
            w-full bg-white/5 border border-white/10 rounded-lg
            pl-11 pr-10 py-3 text-white text-sm font-medium
            placeholder:text-gray-500
            focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
            transition-all
          "
        />
        
        {/* Clear Button */}
        <AnimatePresence>
          {localValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <HiOutlineXMark size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full left-0 right-0 mt-2
              bg-gray-900 border border-white/10 rounded-lg
              shadow-lg overflow-hidden z-50
            "
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="
                  w-full px-4 py-3 text-left text-sm text-white
                  hover:bg-white/5 transition-colors
                  flex items-center gap-3
                "
              >
                {suggestion.icon && (
                  <span className="text-gray-400">{suggestion.icon}</span>
                )}
                <span>{suggestion.label || suggestion}</span>
                {suggestion.description && (
                  <span className="text-gray-500 text-xs ml-auto">
                    {suggestion.description}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
