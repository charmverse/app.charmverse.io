import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { Fragment, type ReactNode } from 'react';

import theme from 'theme/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <CssVarsProvider theme={theme}>
        {/* eslint-disable */}
        <Fragment>{children}</Fragment>
      </CssVarsProvider>
    </AppRouterCacheProvider>
  );
}
