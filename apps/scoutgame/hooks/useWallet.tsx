import { log } from '@charmverse/core/log';
import { useMemo } from 'react';
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

  // WalletConnect appears 3 times in dev for some reason
  const uniqConnectors = useMemo(() => {
    return connectors.filter((connector, index, self) => {
      return index === self.findIndex((t) => t.id === connector.id);
    });
  }, [connectors]);

  return {
    isConnected,
    address,
    chainId,
    connectors: uniqConnectors,
    connectError,
    connectWallet,
    disconnectAsync,
    walletClient: data
  };
}
