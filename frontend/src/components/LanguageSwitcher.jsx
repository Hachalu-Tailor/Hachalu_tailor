import { useTranslation } from 'react-i18next';
import { HiOutlineGlobeAlt } from 'react-icons/hi';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'om', name: 'Afaan Oromo', flag: '🇪🇹' }
];

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <HiOutlineGlobeAlt className="text-gray-400" size={20} />
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className="bg-transparent border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-zinc-800">
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
