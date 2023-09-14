import { RPCList } from 'connectors/index';
import { createConfig, configureChains } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

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

// Set up wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [injectedConnector, coinbaseWalletConnector, walletConnectConnector],
  publicClient
});
