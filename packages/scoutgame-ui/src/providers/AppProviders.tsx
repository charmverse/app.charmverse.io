import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { PurchaseProvider } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { SnackbarProvider } from '@packages/scoutgame-ui/providers/SnackbarContext';
import { UserProvider } from '@packages/scoutgame-ui/providers/UserProvider';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import theme from '../theme/theme';

import { SWRProvider } from './SwrProvider';
import { WagmiProvider } from './WagmiProvider';

// This is required to provider the MUI theme otherwise the defaultProps are not applied
export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return (
    <WagmiProvider
      cookie={headers().get('cookie') ?? ''}
      walletConnectProjectId={process.env.REACT_APP_WALLETCONNECT_PROJECTID}
    >
      <AppRouterCacheProvider options={{ key: 'css' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <SWRProvider>
            <UserProvider userSession={user}>
              <SnackbarProvider>
                <PurchaseProvider>{children}</PurchaseProvider>
              </SnackbarProvider>
            </UserProvider>
          </SWRProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </WagmiProvider>
  );
}
