import { log } from '@charmverse/core/log';
import type { Connector } from 'wagmi';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';

export function useWallet() {
  const { isConnected, address, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { connectors, connectAsync, error: connectError } = useConnect();
  const { data } = useWalletClient();

  const connectWallet = async (connector: Connector) => {
    try {
      if (isConnected) {
        await disconnectAsync();
      }

      await connectAsync({ connector });
    } catch (error) {
      log.error('Error connecting wallet', { error });
    }
  };

  return {
    isConnected,
    address,
    chainId,
    connectors,
    connectError,
    connectWallet,
    disconnectAsync,
    walletClient: data
  };
}
