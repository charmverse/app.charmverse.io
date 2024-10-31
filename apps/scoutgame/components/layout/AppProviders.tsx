import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import type { SessionUser } from 'lib/session/getUserFromSession';
import theme from 'theme/theme';

import { PurchaseProvider } from './PurchaseProvider';
import { SnackbarProvider } from './SnackbarContext';
import { SWRProvider } from './SwrProvider';
import { UserProvider } from './UserProvider';

export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return (
    <AppRouterCacheProvider options={{ key: 'css' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <WagmiProvider
          cookie={headers().get('cookie') ?? ''}
          walletConnectProjectId={process.env.REACT_APP_WALLETCONNECT_PROJECTID}
        >
          <SWRProvider>
            <UserProvider userSession={user}>
              <SnackbarProvider>
                <PurchaseProvider>{children}</PurchaseProvider>
              </SnackbarProvider>
            </UserProvider>
          </SWRProvider>
        </WagmiProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
