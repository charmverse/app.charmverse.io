import 'server-only';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { cookieToInitialState } from 'wagmi';

import theme from 'theme/theme';

import { getConfig } from '../../lib/auth/wagmiConfig';

import { WagmiProvider } from './WagmiProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const wagmiInitialState = cookieToInitialState(getConfig(), headers().get('cookie'));

  return (
    <AppRouterCacheProvider>
      <CssVarsProvider theme={theme} defaultColorScheme='dark'>
        <InitColorSchemeScript defaultMode='dark' />
        <WagmiProvider initialState={wagmiInitialState}>{children}</WagmiProvider>
      </CssVarsProvider>
    </AppRouterCacheProvider>
  );
}
