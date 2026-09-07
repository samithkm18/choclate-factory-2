import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import knTranslation from './locales/kn.json';
import taTranslation from './locales/ta.json';
import teTranslation from './locales/te.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  kn: { translation: knTranslation },
  ta: { translation: taTranslation },
  te: { translation: teTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('manis_lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
