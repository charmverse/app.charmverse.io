import env from '@beam-australia/react-env';
import { getChainList } from 'connectors/chains';
import type { Address } from 'viem';
import { createPublicClient, custom, createWalletClient, http } from 'viem';
import type { Connector } from 'wagmi';
import { createConfig, configureChains, mainnet } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MockConnector } from 'wagmi/connectors/mock';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

import 'viem/window';
import { isTestEnv } from 'config/constants';

const allChains = getChainList({ enableTestnets: true });

// map our RPC list to the wagmi chain list
const viemChains = allChains.map((rpc) => rpc.viem);

const { chains, publicClient } = configureChains(viemChains, [publicProvider()]);

const connectors: Connector[] = [
  new InjectedConnector({
    chains,
    options: {
      name: 'Injected',
      shimDisconnect: true
    }
  }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'CharmVerse.io'
    }
  })
];

const walletConnectProjectId = env('WALLETCONNECT_PROJECTID');
if (walletConnectProjectId) {
  connectors.push(
    new WalletConnectConnector({
      chains,
      options: {
        projectId: walletConnectProjectId
      }
    })
  );
}

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
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
    const storedAccount = window.localStorage.getItem('charm.v1.testWalletAddress') as Address;
    const account = storedAccount || '0x80c2AE072212ab96B7fa2fEE0efba986DC46C4e5';

    // use mocked window.ethereum when available or default to http provider
    const transport =
      typeof window.ethereum !== 'undefined' ? custom(window.ethereum) : http(mainnet.rpcUrls.default.http[0]);

    return createConfig({
      autoConnect: !!storedAccount,
      connectors: [
        new MockConnector({
          chains: [mainnet],
          options: {
            walletClient: createWalletClient({
              chain: mainnet,
              transport,
              account
            }),
            flags: {
              isAuthorized: true
            }
          }
        }),
        new InjectedConnector({
          chains,
          options: {
            name: 'Injected',
            shimDisconnect: true
          }
        })
      ],
      publicClient: createPublicClient({
        chain: mainnet,
        transport
      })
    });
  }
};
