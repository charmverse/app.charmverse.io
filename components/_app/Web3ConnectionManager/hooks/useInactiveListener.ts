import { log } from '@charmverse/core/log';
import type { Web3Provider } from '@ethersproject/providers';
import { injectedConnector } from 'connectors/config';
import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

type WindowType = Window & typeof globalThis & { ethereum?: Web3Provider };

export const useInactiveListener = (suppress = false): void => {
  const { connectAsync } = useConnect();
  const { isConnected } = useAccount();

  useEffect((): any => {
    const { ethereum } = window as WindowType;

    if (ethereum?.on && !isConnected && !suppress) {
      const handleChainChanged = (_chainId: string | number) => {
        connectAsync({ connector: injectedConnector }).catch((err) => {
          log.warn('Failed to activate after chain changed', err);
        });
      };
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          connectAsync({ connector: injectedConnector }).catch((err) => {
            log.warn('Failed to activate after accounts changed', err);
          });
        }
      };

      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [connectAsync, suppress, isConnected]);
};
