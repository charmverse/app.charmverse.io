'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WagmiProvider as OriginalWagmiProvider, cookieToInitialState } from 'wagmi';

import { getConfig } from './wagmiConfig';

// Use this provider for SSR https://wagmi.sh/react/guides/ssr, if we need it
export function WagmiProvider({
  children,
  cookie,
  walletConnectProjectId
}: {
  children: React.ReactNode;
  cookie?: string;
  walletConnectProjectId?: string;
}) {
  const [config] = useState(() => getConfig({ projectId: walletConnectProjectId || '' }));
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(config, cookie);

  return (
    <OriginalWagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </OriginalWagmiProvider>
  );
}
