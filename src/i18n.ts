import i18n from 'i18next';
import { initReactI18next } from '../node_modules/react-i18next';
import type { Callback } from 'i18next';

import en from '../locales/en/translation.json';

// Only the default (English) locale is bundled up front. The others are
// code-split and fetched on demand when the user switches language, keeping
// the initial JS bundle smaller and cutting memory for English-first users.
type TranslationResources = Record<string, unknown>;
const localeLoaders: Record<string, () => Promise<{ default: TranslationResources }>> = {
  kin: () => import('../locales/kin/translation.json'),
  sw: () => import('../locales/sw/translation.json'),
  fr: () => import('../locales/fr/translation.json'),
};

async function ensureLocaleLoaded(lang: string): Promise<void> {
  if (lang === 'en' || i18n.hasResourceBundle(lang, 'translation')) return;
  const loader = localeLoaders[lang];
  if (!loader) return;
  try {
    const { default: bundle } = await loader();
    i18n.addResourceBundle(lang, 'translation', bundle);
  } catch {
    // Fall back to English if the locale chunk fails to load.
  }
}

const getStoredLang = (): string =>
  typeof window !== 'undefined' ? (localStorage.getItem('vdk_lang') || 'en') : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: getStoredLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Load the stored language on startup if it isn't English.
const initialLang = getStoredLang();
if (typeof window !== 'undefined' && initialLang !== 'en') {
  void ensureLocaleLoaded(initialLang).then(() => {
    if (i18n.language !== initialLang) i18n.changeLanguage(initialLang);
  });
}

// Defer locale loading until the first switch to that language.
const baseChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = (async (lang: string | undefined, callback?: Callback) => {
  if (lang && lang !== i18n.language && lang !== 'en') {
    await ensureLocaleLoaded(lang);
  }
  return baseChangeLanguage(lang, callback);
}) as typeof i18n.changeLanguage;

export default i18n;
