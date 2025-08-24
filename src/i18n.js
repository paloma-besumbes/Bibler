import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es.json";
import en from "./locales/en.json";
import it from "./locales/it.json";
import fr from "./locales/fr.json";

const resources = { es: { translation: es }, en: { translation: en }, it: { translation: it }, fr: { translation: fr } };

// Idioma inicial: 1) localStorage, 2) navegador, 3) 'es'
const saved = typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null;
const browser = typeof navigator !== "undefined" ? (navigator.language || "").slice(0, 2) : "es";
const supported = ["es", "en", "it", "fr"];
const initial = saved || (supported.includes(browser) ? browser : "es");

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: initial,
        fallbackLng: "es",
        interpolation: { escapeValue: false },
    });

export default i18n;
