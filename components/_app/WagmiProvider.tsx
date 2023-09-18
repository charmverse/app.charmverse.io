import { getTestWagmiConfig, wagmiConfig } from 'connectors/config';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { WagmiConfig } from 'wagmi';

import { isTestEnv } from 'config/constants';

type Props = {
  children: ReactNode;
};

export function WagmiProvider({ children }: Props) {
  const [config, setConfig] = useState(() => (isTestEnv ? undefined : wagmiConfig));

  useEffect(() => {
    // get config with mocked injector for tests
    if (isTestEnv && typeof window !== 'undefined' && !config) {
      setConfig(getTestWagmiConfig() as any);
    }
  }, [config]);

  if (!config) {
    return null;
  }

  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}
