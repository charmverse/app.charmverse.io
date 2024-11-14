import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { UserProvider } from '@packages/scoutgame-ui/providers/UserProvider';
import type { ReactNode } from 'react';

import type { SessionUser } from 'lib/session/interfaces';
import theme from 'theme/theme';

import { SWRProvider } from './SwrProvider';

export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return (
    <AppRouterCacheProvider options={{ key: 'css' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <SWRProvider>
          <UserProvider userSession={user}>{children}</UserProvider>
        </SWRProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
