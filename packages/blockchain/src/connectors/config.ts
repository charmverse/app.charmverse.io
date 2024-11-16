import env from '@beam-australia/react-env';
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors';
import type { Chain, Transport } from 'viem';
import { http } from 'viem';
import { createConfig } from 'wagmi';

import { getChainList } from './chains';

import 'viem/window';

const allChains = getChainList({ enableTestnets: true });

// map our RPC list to the wagmi chain list
const viemChains = allChains.map((rpc) => rpc.viem) as [Chain, ...Chain[]];

const connectors = [
  injected({
    shimDisconnect: true
    // target: {
    //   name: 'Injected'
    // }
  }),
  coinbaseWallet({
    appName: 'CharmVerse.io'
  }),
  ...(env('WALLETCONNECT_PROJECTID') ? [walletConnect({ projectId: env('WALLETCONNECT_PROJECTID') })] : [])
];

export const wagmiConfig = createConfig({
  chains: viemChains,
  connectors,
  ssr: true, // prevents error: "localStorage not defined"  during npm run build
  transports: viemChains.reduce<Record<string, Transport>>((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {})
});

// get wagmi config based on env - TODO: do we need a method? or just override the wagmiConfig export?
export const getWagmiConfig = (): typeof wagmiConfig => {
  return wagmiConfig;
};
