import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { ReactNode } from 'react';

import theme from 'theme/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'css' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
