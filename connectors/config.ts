import { createConfig, configureChains, mainnet } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

// TODO: Supported chains from our rpc list
const { chains, publicClient, webSocketPublicClient } = configureChains([mainnet], [publicProvider()]);

// Set up wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
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
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID as string
      }
    })
  ],
  publicClient,
  webSocketPublicClient
});
