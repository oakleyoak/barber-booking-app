import React from 'react';
import { useLanguage, Language } from './LanguageContext';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'tr' as Language, name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
    { code: 'fa' as Language, name: 'فارسی', flag: '🇮🇷' },
    { code: 'el' as Language, name: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
  ];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('language.selectLanguage')}
      </label>
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value as Language)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        aria-label={t('language.selectLanguage')}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;