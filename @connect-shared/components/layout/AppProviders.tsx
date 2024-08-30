import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { ReactNode } from 'react';

export function AppProviders({ children, theme }: { children: ReactNode; theme: any }) {
  return (
    <AppRouterCacheProvider>
      <CssVarsProvider theme={theme} defaultColorScheme='dark'>
        <InitColorSchemeScript defaultMode='dark' />
        {children}
      </CssVarsProvider>
    </AppRouterCacheProvider>
  );
}
