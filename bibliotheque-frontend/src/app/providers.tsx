'use client';

import { ThemeProvider } from '@/shared/theme';
import { I18nProvider } from '@/shared/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
