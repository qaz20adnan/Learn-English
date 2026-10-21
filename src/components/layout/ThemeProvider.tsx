'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Wraps the app in `next-themes` using the class strategy so the `dark` class
 * (and every Tailwind `dark:` utility) is toggled instantly on `<html>`.
 * `storageKey` matches the legacy key so existing preferences keep working.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="eja-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
