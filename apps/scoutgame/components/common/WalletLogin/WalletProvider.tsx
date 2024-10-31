import { headers } from 'next/headers';

import { WagmiProvider } from './WagmiProvider';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <WagmiProvider cookie={headers().get('cookie') ?? ''}>{children}</WagmiProvider>;
}
