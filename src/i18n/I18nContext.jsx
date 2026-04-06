import { createContext, useMemo } from 'react';
import { translations } from './translations';

export const I18nContext = createContext(null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function I18nProvider({ children }) {
  const value = useMemo(() => {
    const locale = navigator.language?.startsWith('es') ? 'es' : 'en';
    const strings = translations[locale] || translations.en;

    function t(key, params) {
      let result = getNestedValue(strings, key) || getNestedValue(translations.en, key) || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, v);
        });
      }
      return result;
    }

    return { t, locale };
  }, []);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
