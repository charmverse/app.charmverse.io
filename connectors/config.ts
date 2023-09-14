import { createConfig, configureChains, mainnet } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

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
