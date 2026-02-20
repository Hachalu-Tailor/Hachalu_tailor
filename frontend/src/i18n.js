import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

<<<<<<< HEAD
=======
import en from './locales/en.json';
import om from './locales/om.json';

>>>>>>> b2665f5aa97e0b40eba9397f651a8f19f820dec5
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
<<<<<<< HEAD
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
=======
      en: { translation: en },
      om: { translation: om }
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
>>>>>>> b2665f5aa97e0b40eba9397f651a8f19f820dec5
