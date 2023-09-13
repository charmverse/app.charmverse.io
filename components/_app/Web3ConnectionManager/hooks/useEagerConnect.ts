import { injectedConnector } from 'connectors/config';
import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

export const useEagerConnect = (): boolean => {
  const { connect } = useConnect();
  const { isConnected, connector: activeConnector } = useAccount();

  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (tried || isConnected) {
      return;
    }

    if (!injectedConnector || injectedConnector.id === activeConnector?.id) {
      setTried(true);
      return;
    }

    injectedConnector
      .isAuthorized()
      .then((isAuthorized) => {
        if (isAuthorized) {
          setTimeout(() => {
            connect({ connector: injectedConnector });
          }, 1000);
        }

        return isAuthorized ? connect({ connector: injectedConnector }) : Promise.resolve();
      })
      .catch(() => setTried(true))
      .finally(() => setTried(true));
  }, [activeConnector?.id, connect, isConnected, tried]);

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (!tried && isConnected) {
      setTried(true);
    }
  }, [tried, isConnected]);

  return tried;
};
