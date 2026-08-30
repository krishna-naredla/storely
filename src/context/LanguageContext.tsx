import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('storelly_lang') as Language;
    return (savedLang && translations[savedLang]) ? savedLang : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('storelly_lang', lang);
    document.documentElement.lang = lang; // Set HTML lang attribute for accessibility
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, variables?: Record<string, any>): string => {
    const keys = key.split('.');
    
    // First try the current language
    let value: any = translations[language];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k as keyof typeof value];
    }
    
    // Fallback to English if translation is missing
    if (value === undefined && language !== 'en') {
      value = translations['en'];
      for (const k of keys) {
        if (value === undefined) break;
        value = value[k as keyof typeof value];
      }
    }

    if (typeof value === 'string') {
      let result = value;
      if (variables) {
        Object.keys(variables).forEach(varKey => {
          result = result.replace(new RegExp(`{${varKey}}`, 'g'), String(variables[varKey]));
        });
      }
      return result;
    }

    // If key not found or not a string, return the key itself
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
