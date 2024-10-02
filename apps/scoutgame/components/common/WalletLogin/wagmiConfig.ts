import env from '@beam-australia/react-env';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain, Transport } from 'viem';
import * as chains from 'viem/chains';
import { http, cookieStorage, createStorage } from 'wagmi';

export function getConfig() {
  const walletConnectProjectId = env('WALLETCONNECT_PROJECTID');
  const viemChains = Object.values(chains) as unknown as [Chain, ...Chain[]];
  const transports = viemChains.reduce<Record<string, Transport>>((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {});

  const config = getDefaultConfig({
    appName: 'Scout Game',
    projectId: walletConnectProjectId,
    chains: viemChains,
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports
  });

  return config;
}
