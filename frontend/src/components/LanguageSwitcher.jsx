import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { HiOutlineGlobeAlt, HiCheck } from 'react-icons/hi';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'om', name: 'Afaan Oromo', flag: '🇪🇹' }
];

const LanguageSwitcher = ({ className = '' }) => {
  const { language: currentLang, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setOpen(false);
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <HiOutlineGlobeAlt size={16} className="sm:size-[18px]" />
        <span className="inline">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.name}</span>
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-xl z-50 transform origin-top-right dark:bg-gray-800">
        <div className="py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${currentLang === lang.code
                  ? 'bg-red-50 text-red-600 font-semibold dark:bg-red-900/20'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.name}</span>
              {currentLang === lang.code && (
                <HiCheck size={18} className="text-red-600" />
              )}
            </button>
          ))}
        </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
