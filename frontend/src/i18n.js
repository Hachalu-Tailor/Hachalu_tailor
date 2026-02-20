import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          nav: { home: "Home", services: "Services", shop: "Shop", contact: "Need Help?" },
          hero: { title: "Get In Touch" }
        }
      },
      am: { // Amharic Example
        translation: {
          nav: { home: "ዋና ገጽ", services: "አገልግሎቶች", shop: "ሱቅ", contact: "እርዳታ ይፈልጋሉ?" },
          hero: { title: "ያግኙን" }
        }
      }
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;