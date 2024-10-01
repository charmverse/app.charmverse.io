'use client';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { State } from 'wagmi';
import { WagmiProvider as OriginalWagmiProvider } from 'wagmi';

import { getConfig } from './wagmiConfig';

const config = getConfig();
const queryClient = new QueryClient();
export function WagmiProvider({ children, initialState }: { children: React.ReactNode; initialState?: State }) {
  return (
    <OriginalWagmiProvider initialState={initialState} config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </OriginalWagmiProvider>
  );
}
