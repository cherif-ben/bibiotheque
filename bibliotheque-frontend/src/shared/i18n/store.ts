import { translations, type Locale } from './translations';

/** Langue courante partagée (écrite par I18nProvider, lue par les hooks hors React). */
let currentLocale: Locale = 'fr';

export function setStoredLocale(locale: Locale) {
  currentLocale = locale;
}

/** Traduit une clé en dehors des composants React (hooks, services). */
export function tr(key: string): string {
  const dict = translations[currentLocale] as Record<string, string>;
  return dict[key] ?? translations.fr[key as keyof typeof translations.fr] ?? key;
}
