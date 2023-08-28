import type WalletConnectProvider from '@walletconnect/ethereum-provider';
import type { EthereumProviderOptions } from '@walletconnect/ethereum-provider/dist/types/EthereumProvider';
import { AbstractConnector } from '@web3-react/abstract-connector';
import type { ConnectorUpdate } from '@web3-react/types';

export class WalletConnectV2Connector extends AbstractConnector {
  provider?: typeof WalletConnectProvider.prototype;

  private readonly options: EthereumProviderOptions;

  constructor(options: EthereumProviderOptions) {
    super({ supportedChainIds: Object.keys(options.rpcMap || {}).map((k) => Number(k)) });

    this.options = options;
  }

  static clearStorage = (storage: Storage) => {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.match(/^wc@2:/)) {
        storage.removeItem(key);
        i -= 1;
      }
    }
  };

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const provider = await import('@walletconnect/ethereum-provider').then((module) => {
      return module.default.init({
        projectId: this.options.projectId,
        rpcMap: this.options.rpcMap || {},
        chains: this.options.chains,
        optionalChains: this.options.optionalChains,
        relayUrl: this.options.relayUrl,
        showQrModal: true,
        // RPCs may not support the `test` method used for the ping.
        disableProviderPing: true,
        qrModalOptions: {
          themeVariables: {
            // Display the WC modal over other modals in the UI.
            // Won't be visible without this.
            '--wcm-z-index': '3000'
          }
        },
        // List of methods to expose
        // https://github.com/WalletConnect/walletconnect-monorepo/blob/v2.0/providers/ethereum-provider/src/constants/rpc.ts
        // If the wallet doesn't support non optional methods, it will not allow the connection.
        methods: ['eth_sendTransaction', 'personal_sign'],
        optionalMethods: [
          'eth_accounts',
          'eth_requestAccounts',
          'eth_sendRawTransaction',
          'eth_signTransaction',
          'wallet_switchEthereumChain'
        ],
        events: ['chainChanged', 'accountsChanged'],
        optionalEvents: ['disconnect']
      });
    });

    const accounts = await provider.enable();

    provider.on('accountsChanged', this.handleAccountsChanged);
    provider.on('chainChanged', this.handleChainChanged);
    provider.on('disconnect', this.handleDisconnect);

    this.provider = provider;

    return {
      chainId: provider.chainId,
      account: accounts[0],
      provider
    };
  };

  getProvider = async (): Promise<any> => {
    if (!this.provider) {
      throw new Error('Provider is undefined');
    }
    return this.provider;
  };

  getChainId = async (): Promise<string | number> => {
    if (!this.provider) {
      throw new Error('Provider is undefined');
    }
    return this.provider.chainId;
  };

  getAccount = async (): Promise<string | null> => {
    if (!this.provider) {
      throw new Error('Provider is undefined');
    }
    return this.provider.accounts[0];
  };

  getWalletName = (): string | undefined => {
    return this.provider?.session?.peer.metadata.name;
  };

  deactivate = (): void => {
    if (!this.provider) {
      return;
    }
    this.emitDeactivate();

    this.provider
      .removeListener('accountsChanged', this.handleAccountsChanged)
      .removeListener('chainChanged', this.handleChainChanged)
      .removeListener('disconnect', this.handleDisconnect)
      .disconnect();
  };

  handleAccountsChanged = (accounts: string[]): void => {
    this.emitUpdate({ account: accounts[0] });
  };

  handleChainChanged = (chainId: string | number): void => {
    this.emitUpdate({ chainId });
  };

  handleDisconnect = (): void => {
    if (!this.provider) {
      throw new Error('Provider is undefined');
    }
    this.deactivate();
  };
}
