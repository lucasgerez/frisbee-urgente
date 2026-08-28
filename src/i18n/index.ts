import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './en.json'
import es from './es.json'
import ptBR from './pt-BR.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
          translation: en,
      },
      'pt-BR': {
        translation: ptBR,
      },
      es: {
        translation: es,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt-BR',],
    detection: {
      order: ['navigator'],
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n