import { RPCList } from 'connectors/index';
import type { Address } from 'viem';
import { createPublicClient, custom, createWalletClient } from 'viem';
import { createConfig, configureChains, mainnet } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MockConnector } from 'wagmi/connectors/mock';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';
import 'viem/window';

import { isTestEnv } from 'config/constants';
import { isTruthy } from 'lib/utilities/types';

const wagmiChainList = Object.values(wagmiChains);
// map our RPC list to the wagmi chain list
const supportedChains = RPCList.map((rpc) => wagmiChainList.find((ch) => ch.id === rpc.chainId)).filter(isTruthy);

const { chains, publicClient } = configureChains(supportedChains, [publicProvider()]);

export const injectedConnector = new InjectedConnector({
  chains,
  options: {
    name: 'Injected',
    shimDisconnect: true
  }
});

export const coinbaseWalletConnector = new CoinbaseWalletConnector({
  chains,
  options: {
    appName: 'CharmVerse.io'
  }
});

export const walletConnectConnector = new WalletConnectConnector({
  chains,
  options: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID as string
  }
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [injectedConnector, coinbaseWalletConnector, walletConnectConnector],
  publicClient
});

export const getTestWagmiConfig = () => {
  if (!isTestEnv) {
    return wagmiConfig;
  }

  // use custom window.ethereum object in tests to be able to mock it
  // https://github.com/DePayFi/web3-mock#viem--wagmi
  // NOTE: we need window object first, to be able to use window.ethereum
  if (typeof window !== 'undefined') {
    // get the test wallet address set by the test runner or use a default one
    const account = (window.localStorage.getItem('charm.v1.testWalletAddress') ||
      '0x80c2AE072212ab96B7fa2fEE0efba986DC46C4e5') as Address;

    return createConfig({
      autoConnect: true,
      connectors: [
        new MockConnector({
          chains: [mainnet],
          options: {
            walletClient: createWalletClient({
              chain: mainnet,
              transport: custom(window.ethereum),
              account
            }),
            flags: {
              isAuthorized: true
            }
          }
        })
      ],
      publicClient: createPublicClient({
        chain: mainnet,
        transport: custom(window.ethereum)
      })
    });
  }
};
