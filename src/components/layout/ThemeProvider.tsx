'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Wraps the app in `next-themes` using a `data-theme` attribute. The CSS design
 * tokens in `globals.css` expose five palettes (light, dark, emerald, sepia,
 * midnight); `system` resolves to light or dark automatically. The storage key
 * is unchanged so existing preferences keep working.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={['light', 'dark', 'emerald', 'sepia', 'midnight']}
      defaultTheme="system"
      enableSystem
      storageKey="eja-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
