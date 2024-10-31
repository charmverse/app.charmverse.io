'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { getAlchemyBaseUrl } from '@root/lib/blockchain/provider/alchemy/client';
import type { Chain, Transport } from 'viem';
import { http, cookieStorage, createStorage, fallback } from 'wagmi';
import {
  arbitrum,
  arbitrumSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
  zora,
  zoraSepolia,
  base,
  baseSepolia
} from 'wagmi/chains';

export function getConfig() {
  const walletConnectProjectId = process.env.REACT_APP_WALLETCONNECT_PROJECTID || '';

  const wagmiChains = [
    mainnet,
    sepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia,
    arbitrum,
    arbitrumSepolia,
    zora,
    zoraSepolia
  ] as [Chain, ...Chain[]];
  const transports = wagmiChains.reduce<Record<string, Transport>>((acc, chain) => {
    try {
      const rpcUrl = getAlchemyBaseUrl(chain.id);
      acc[chain.id] = fallback([http(rpcUrl), http()]);
      return acc;
    } catch (_) {
      acc[chain.id] = http();
      return acc;
    }
  }, {});

  const config = getDefaultConfig({
    appName: 'Scout Game',
    projectId: walletConnectProjectId,
    chains: wagmiChains,
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports
  });

  return config;
}
