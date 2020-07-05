import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import XHR from "i18next-xhr-backend";
import { initReactI18next } from "react-i18next";

import commonEn from "./locales/en/common.json";
import commonFr from "./locales/fr/common.json";

i18n
  .use(XHR)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    lng: "fr",
    whitelist: ["fr", "en"],
    nonExplicitWhitelist: true,
    load: "languageOnly",
    fallbackLng: "en", // use en if detected lng is not available
    // saveMissing: true, // send not translated keys to endpoint
    keySeparator: false, // we do not use keys in form messages.welcome
    returnEmptyString: false,
    interpolation: {
      escapeValue: false // react already safes from xss
    },

    resources: {
      en: {
        common: commonEn
      },
      fr: {
        common: commonFr
      },
    },
    // have a common namespace used around the full app
    nsSeparator: '',
    ns: ["common"],
    defaultNS: "common"
  });

export default i18n;
