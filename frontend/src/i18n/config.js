import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import translationES from "../locales/es/translation.json";
import translationEN from "../locales/en/translation.json";
import cardsES from "../locales/es/cards.json";
import cardsEN from "../locales/en/cards.json";
import gameES from "../locales/es/game.json";
import gameEN from "../locales/en/game.json";

const resources = {
  es: {
    translation: translationES,
    cards: cardsES,
    game: gameES,
  },
  en: {
    translation: translationEN,
    cards: cardsEN,
    game: gameEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    defaultNS: "translation",
    ns: ["translation", "cards", "game"],

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
