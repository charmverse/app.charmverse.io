import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/discord/constants';
import log from 'lib/log';
import { getCookie, deleteCookie } from 'lib/utilities/browser';
import type { LoggedInUser } from 'models';

interface Props {
  children: JSX.Element;
}

type IDiscordConnectionContext = {
  isConnected: boolean;
  isLoading: boolean;
  connect: VoidFunction;
  error?: string;
};

export const DiscordConnectionContext = createContext<Readonly<IDiscordConnectionContext>>({
  connect: () => {},
  error: undefined,
  isConnected: false,
  isLoading: false
});

export function DiscordProvider({ children }: Props) {
  const { user, setUser } = useUser();
  const { showMessage } = useSnackbar();
  const authCode = getCookie(AUTH_CODE_COOKIE);
  const authError = getCookie(AUTH_ERROR_COOKIE);

  const [discordError, setDiscordError] = useState('');
  const [isDisconnectingDiscord, setIsDisconnectingDiscord] = useState(false);
  const [isConnectDiscordLoading, setIsConnectDiscordLoading] = useState(false);

  const connectedWithDiscord = Boolean(user?.discordUser);

  async function connect() {
    if (!isConnectDiscordLoading) {
      if (connectedWithDiscord) {
        await disconnect();
      } else {
        window.location.replace(
          `/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=connect`
        );
      }
    }
    setIsDisconnectingDiscord(false);
  }

  async function disconnect() {
    setIsDisconnectingDiscord(true);

    return charmClient.discord
      .disconnectDiscord()
      .then(() => {
        setUser((_user: LoggedInUser) => ({ ..._user, discordUser: null }));
      })
      .catch((error) => {
        log.warn('Error disconnecting from discord', error);
      })
      .finally(() => {
        setIsDisconnectingDiscord(false);
      });
  }

  useEffect(() => {
    if (authError) {
      deleteCookie(AUTH_ERROR_COOKIE);
      showMessage('Failed to connect to discord');
    }
  }, [authError]);

  // It can either be fail or success
  useEffect(() => {
    // Connection with discord
    if (authCode && user) {
      deleteCookie(AUTH_CODE_COOKIE);
      if (!user.discordUser) {
        setIsConnectDiscordLoading(true);

        charmClient.discord
          .connectDiscord({
            code: authCode
          })
          .then((updatedUserFields) => {
            setUser((_user: LoggedInUser) => ({ ..._user, ...updatedUserFields }));
          })
          .catch((err) => {
            setDiscordError(err.message || err.error || 'Something went wrong. Please try again');
          })
          .finally(() => {
            setIsConnectDiscordLoading(false);
          });
      }
    }
  }, [user, authCode]);

  const isConnected = connectedWithDiscord;
  const isLoading = !discordError && (!!authCode || isDisconnectingDiscord || isConnectDiscordLoading);
  const error = authError;

  const value = useMemo<IDiscordConnectionContext>(
    () => ({
      isLoading,
      isConnected,
      connect,
      error
    }),
    [isConnected, isLoading, error]
  );

  return <DiscordConnectionContext.Provider value={value}>{children}</DiscordConnectionContext.Provider>;
}

export const useDiscordConnection = () => useContext(DiscordConnectionContext);
