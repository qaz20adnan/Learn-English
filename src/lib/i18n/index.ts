import { dictionaries, type Dictionary } from './dictionaries';
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

export { dictionaries };
export type { Dictionary };
export * from './config';

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
