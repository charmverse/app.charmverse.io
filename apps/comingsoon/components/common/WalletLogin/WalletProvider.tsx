import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';

import { getConfig } from 'lib/blockchain/wagmiConfig';

import { WagmiProvider } from './WagmiProvider';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wagmiInitialState = cookieToInitialState(getConfig(), headers().get('cookie'));

  return <WagmiProvider initialState={wagmiInitialState}>{children}</WagmiProvider>;
}
