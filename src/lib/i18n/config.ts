export const LOCALES = ['ar', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export type Dir = 'rtl' | 'ltr';

export const DEFAULT_LOCALE: Locale = 'ar';

/** Cookie that stores the *interface* language. Independent from content language. */
export const LOCALE_COOKIE = 'eja_locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'ar' || value === 'en';
}

export function dirFor(locale: Locale): Dir {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function localeLabel(locale: Locale): string {
  return locale === 'ar' ? 'العربية' : 'English';
}
