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
  const [translations, setTranslations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && ['en', 'tr', 'ar', 'fa', 'el', 'ru'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await getTranslations(language);
        setTranslations(translationModule);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English
        try {
          const englishModule = await getTranslations('en');
          setTranslations(englishModule);
          setIsLoading(false);
        } catch (fallbackError) {
          console.error('Error loading English translations:', fallbackError);
          // If even English fails, set empty translations
          setTranslations({});
          setIsLoading(false);
        }
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Translation loading timeout, falling back to English');
        setTranslations({});
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    loadTranslations();

    return () => clearTimeout(timeoutId);
  }, [language]);

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    if (isLoading || !translations) {
      return key; // Return key while loading
    }

    const keys = key.split('.');
    let value: any = translations;

    // Navigate through nested object
    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      return key; // Return key if no translation found
    }

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), val);
      });
    }

    return value;
  };

  // Show loading screen instead of null
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen font-sans">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Dynamic import of translations
const getTranslations = async (lang: Language) => {
  const translationModules = {
    en: () => import('./translations/en').then(m => m.default),
    tr: () => import('./translations/tr').then(m => m.default),
    ar: () => import('./translations/ar').then(m => m.default),
    fa: () => import('./translations/fa').then(m => m.default),
    el: () => import('./translations/el').then(m => m.default),
    ru: () => import('./translations/ru').then(m => m.default),
  };

  try {
    return await translationModules[lang]();
  } catch (error) {
    // Fallback to English if translation not found
    console.warn(`Translation for language '${lang}' not found, falling back to English`);
    return await translationModules.en();
  }
};