import { WagmiProvider } from '@packages/scoutgame-ui/providers/WagmiProvider';
import { headers } from 'next/headers';

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
