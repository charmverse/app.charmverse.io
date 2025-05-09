import { getWagmiConfig, wagmiConfig } from '@packages/blockchain/connectors/config';
import { isDevEnv, isTestEnv } from '@packages/config/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import type { Config } from 'wagmi';
import { WagmiProvider as OriginalWagmiProvider } from 'wagmi';

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | undefined>(() => (isTestEnv && !isDevEnv ? undefined : wagmiConfig));

  const queryClient = new QueryClient();

  useEffect(() => {
    if (isTestEnv && !isDevEnv) {
      setConfig(getWagmiConfig());
    }
  }, [getWagmiConfig, setConfig]);

  if (!config) {
    return null;
  }

  return (
    <OriginalWagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </OriginalWagmiProvider>
  );
}
