import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'te' | 'hi' | 'es' | 'fr';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  dashboard: {
    en: 'Dashboard',
    te: 'డాష్‌బోర్డ్',
    hi: 'डैशबोर्ड',
    es: 'Panel',
    fr: 'Tableau de bord',
  },
  catalog: {
    en: 'Catalog & Menu',
    te: 'క్యాటలాగ్ & మెను',
    hi: 'कैटलॉग और मेनू',
    es: 'Catálogo y Menú',
    fr: 'Catalogue et Menu',
  },
  orders: {
    en: 'Orders & Sales',
    te: 'ఆర్డర్లు & విక్రయాలు',
    hi: 'ऑर्डर और बिक्री',
    es: 'Pedidos y Ventas',
    fr: 'Commandes et Ventes',
  },
  customers: {
    en: 'Customers',
    te: 'కస్టమర్లు',
    hi: 'ग्राहक',
    es: 'Clientes',
    fr: 'Clients',
  },
  settings: {
    en: 'Settings',
    te: 'సెట్టింగ్‌లు',
    hi: 'सेटिंग्स',
    es: 'Ajustes',
    fr: 'Paramètres',
  },
  search: {
    en: 'Search products, orders...',
    te: 'ఉత్పత్తులు, ఆర్డర్‌లను వెతకండి...',
    hi: 'उत्पाद, ऑर्डर खोजें...',
    es: 'Buscar productos, pedidos...',
    fr: 'Rechercher des produits...',
  },
  revenue: {
    en: 'Total Revenue',
    te: 'మొత్తం ఆదాయం',
    hi: 'कुल राजस्व',
    es: 'Ingresos Totales',
    fr: 'Revenu Total',
  },
  active_stores: {
    en: 'Active Storefronts',
    te: 'యాక్టివ్ స్టోర్‌ఫ్రంట్లు',
    hi: 'सक्रिय स्टोरफ्रंट',
    es: 'Tiendas Activas',
    fr: 'Boutiques Actives',
  },
  sync_data: {
    en: 'Sync Data',
    te: 'డేటాను సింక్ చేయండి',
    hi: 'डेटा सिंक करें',
    es: 'Sincronizar',
    fr: 'Synchroniser',
  },
  swipe_to_delete: {
    en: 'Swipe left to delete',
    te: 'తొలగించడానికి ఎడమకు స్వైప్ చేయండి',
    hi: 'हटाने के लिए बाएं स्वाइप करें',
    es: 'Desliza a la izquierda para borrar',
    fr: 'Glisser à gauche pour supprimer',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('storelly_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('storelly_lang', lang);
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
