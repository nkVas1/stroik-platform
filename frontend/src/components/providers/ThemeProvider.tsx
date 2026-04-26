'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Обертка для провайдера тем.
 * Использует next-themes для безопасного переключения CSS-классов на теге html.
 * @param {React.ReactNode} children - Дочерние компоненты.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
