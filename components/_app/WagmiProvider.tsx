import { getTestWagmiConfig, wagmiConfig } from 'connectors/config';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { WagmiConfig } from 'wagmi';

import { isDevEnv, isTestEnv } from 'config/constants';

type Props = {
  children: ReactNode;
};

export function WagmiProvider({ children }: Props) {
  const [config, setConfig] = useState(() => (isTestEnv && !isDevEnv ? undefined : wagmiConfig));

  console.log('WAGMICONFIG', config);

  useEffect(() => {
    // get config with mocked injector for tests
    if (isTestEnv && !isDevEnv && typeof window !== 'undefined' && !config) {
      setConfig(getTestWagmiConfig() as any);
    }
  }, [config]);

  if (!config) {
    return null;
  }

  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}
