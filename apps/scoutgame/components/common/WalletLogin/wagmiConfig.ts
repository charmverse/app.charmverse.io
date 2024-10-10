import env from '@beam-australia/react-env';
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
  zoraSepolia
} from 'wagmi/chains';

export function getConfig() {
  const walletConnectProjectId = env('WALLETCONNECT_PROJECTID');
  const wagmiChains = [mainnet, sepolia, optimism, optimismSepolia, arbitrum, arbitrumSepolia, zora, zoraSepolia] as [
    Chain,
    ...Chain[]
  ];
  const transports = wagmiChains.reduce<Record<string, Transport>>((acc, chain) => {
    const rpcUrl = getAlchemyBaseUrl(chain.id);
    acc[chain.id] = fallback([http(rpcUrl), http()]);
    return acc;
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
