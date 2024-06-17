import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import type { ReactNode } from 'react';

import { SnackbarProvider } from 'hooks/useSnackbar';

import theme from '../../theme/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <CssVarsProvider theme={theme}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </CssVarsProvider>
    </AppRouterCacheProvider>
  );
}
