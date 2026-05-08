import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pt from '../locales/pt.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import { LANGUAGES } from '../data/languages';

const translations = { pt, en, es };

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('kentauros_lang') || 'pt';
  });

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('kentauros_lang', lang);
      document.documentElement.setAttribute('lang', lang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = useCallback((key, vars = {}) => {
    const dict = translations[language] || translations['pt'];
    let value = dict[key] ?? translations['pt'][key] ?? key;
    Object.entries(vars).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{\\{?${k}\\}?\\}`, 'g'), v);
    });
    return value;
  }, [language]);

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, currentLanguage, LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
};
