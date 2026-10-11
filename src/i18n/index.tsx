import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations } from './translations';
import { vi } from './vi';
import { en } from './en';
import { zh } from './zh';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const dictionaries: Record<Language, Translations> = {
  vi,
  en,
  zh,
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vh_lang') as Language | null;
      if (saved && (saved === 'vi' || saved === 'en' || saved === 'zh')) {
        return saved;
      }
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('vi')) return 'vi';
      if (navLang.startsWith('zh')) return 'zh';
    }
    return 'vi'; // Default to Vietnamese per user instructions
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vh_lang', lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: dictionaries[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
