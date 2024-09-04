'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { State } from 'wagmi';
import { WagmiProvider as OriginalWagmiProvider } from 'wagmi';

import { getConfig } from '../../lib/auth/wagmiConfig';

export function WagmiProvider({ children, initialState }: { children: React.ReactNode; initialState?: State }) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <OriginalWagmiProvider initialState={initialState} config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </OriginalWagmiProvider>
  );
}
