'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider as OriginalWagmiProvider, cookieToInitialState } from 'wagmi';

import { getConfig } from './wagmiConfig';

const queryClient = new QueryClient();
const config = getConfig();

// Use this provider for SSR https://wagmi.sh/react/guides/ssr, if we need it
export function WagmiProvider({ children, cookie }: { children: React.ReactNode; cookie?: string }) {
  const initialState = cookieToInitialState(config, cookie);

  return (
    <OriginalWagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </OriginalWagmiProvider>
  );
}
