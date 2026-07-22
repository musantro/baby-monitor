import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";
import en from "./locales/en-EN.json";
import es from "./locales/es-ES.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "en-EN": { translation: en },
      "es-ES": { translation: es },
    },
    fallbackLng: "en-EN",
    supportedLngs: ["en-EN", "es-ES"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["navigator"],
      caches: [],
      convertDetectedLanguage: (language) => language.toLowerCase().startsWith("es") ? "es-ES" : "en-EN",
    },
  });

export function translate(key: string, variables: Record<string, string | number> = {}): string {
  return i18n.t(key, variables);
}

export function useTranslation() {
  return useReactI18nextTranslation().t;
}

export default i18n;
