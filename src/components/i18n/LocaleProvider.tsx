'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  LOCALE_COOKIE,
  dictionaries,
  dirFor,
  type Dictionary,
  type Dir,
  type Locale,
} from '@/lib/i18n';

interface I18nValue {
  locale: Locale;
  dir: Dir;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LocaleProvider({ locale: initialLocale, children }: { locale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [syncedLocale, setSyncedLocale] = useState<Locale>(initialLocale);

  // Re-sync with the server value when the route is refreshed with a new locale
  // (adjusting state during render is the recommended alternative to an effect).
  if (syncedLocale !== initialLocale) {
    setSyncedLocale(initialLocale);
    setLocaleState(initialLocale);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  /**
   * Switches the interface language instantly: updates the in-memory dictionary
   * and the `<html lang/dir>` attributes, persists the choice in a cookie and
   * notifies cookie-based consumers. Server-rendered text catches up when the
   * caller refreshes the route.
   */
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    document.documentElement.dir = dirFor(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event('eja-locale-change'));
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ locale, dir: dirFor(locale), dict: dictionaries[locale], setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within a LocaleProvider');
  return value;
}
