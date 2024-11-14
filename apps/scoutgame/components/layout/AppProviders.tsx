import 'server-only';

import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { AppProviders as AppProvidersBase } from '@packages/scoutgame-ui/providers/AppProviders';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';

import { SWRProvider } from './SwrProvider';

export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return (
    <WagmiProvider
      cookie={headers().get('cookie') ?? ''}
      walletConnectProjectId={process.env.REACT_APP_WALLETCONNECT_PROJECTID}
    >
      <SWRProvider>
        <AppProvidersBase user={user}>{children}</AppProvidersBase>
      </SWRProvider>
    </WagmiProvider>
  );
}
