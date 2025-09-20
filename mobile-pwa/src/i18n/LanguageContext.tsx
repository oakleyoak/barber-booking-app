import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'tr' | 'ar' | 'fa' | 'el' | 'ru';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && ['en', 'tr', 'ar', 'fa', 'el', 'ru'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    // Import translations dynamically
    const translations = getTranslations(language);
    const keys = key.split('.');
    let value: any = translations;

    // Navigate through nested object
    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      // Fallback to English if translation not found
      const englishTranslations = getTranslations('en');
      value = englishTranslations;
      for (const k of keys) {
        value = value?.[k];
      }
      if (typeof value !== 'string') {
        return key; // Return key if no translation found
      }
    }

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), val);
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Dynamic import of translations
const getTranslations = (lang: Language) => {
  const translationModules = {
    en: () => require('./translations/en').default,
    tr: () => require('./translations/tr').default,
    ar: () => require('./translations/ar').default,
    fa: () => require('./translations/fa').default,
    el: () => require('./translations/el').default,
    ru: () => require('./translations/ru').default,
  };

  try {
    return translationModules[lang]();
  } catch (error) {
    // Fallback to English if translation not found
    console.warn(`Translation for language '${lang}' not found, falling back to English`);
    return translationModules.en();
  }
};