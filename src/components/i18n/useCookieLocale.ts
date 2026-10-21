'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale } from '@/lib/i18n';

const EVENT = 'eja-locale-change';

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function getSnapshot(): Locale {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  return resolveLocale(match ? decodeURIComponent(match[1]) : undefined);
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

/** Cookie-backed locale for client components rendered outside a LocaleProvider. */
export function useCookieLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
