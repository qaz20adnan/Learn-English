import { cookies } from 'next/headers';
import { LOCALE_COOKIE, getDictionary, resolveLocale, type Dictionary, type Locale } from './index';

/** Reads the interface language from the request cookie (defaults to Arabic). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getLocaleAndDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
