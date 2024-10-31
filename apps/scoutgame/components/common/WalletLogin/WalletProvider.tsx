import { headers } from 'next/headers';

import { WagmiProvider } from './WagmiProvider';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider
      cookie={headers().get('cookie') ?? ''}
      walletConnectProjectId={process.env.REACT_APP_WALLETCONNECT_PROJECTID}
    >
      {children}
    </WagmiProvider>
  );
}
