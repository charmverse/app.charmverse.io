import env from '@beam-australia/react-env';
import type { Chain, Transport } from 'viem';
import * as chains from 'viem/chains';
import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { coinbaseWallet, injected, metaMask, walletConnect } from 'wagmi/connectors';

export function getConfig() {
  const projectId = env('WALLETCONNECT_PROJECTID');
  const viemChains = Object.values(chains) as unknown as [Chain, ...Chain[]];

  const connectors = [coinbaseWallet(), metaMask(), ...(projectId ? [walletConnect({ projectId })] : [])];

  const transports = viemChains.reduce<Record<string, Transport>>((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {});

  const config = createConfig({
    chains: viemChains,
    multiInjectedProviderDiscovery: false,
    connectors,
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports
  });

  return config;
}
