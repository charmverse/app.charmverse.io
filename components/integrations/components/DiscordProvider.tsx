import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/discord/constants';
import log from 'lib/log';
import { getCookie, deleteCookie } from 'lib/utilities/browser';

interface State {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => void;
  error?: string;
}

interface Props {
  children: (state: State) => JSX.Element;
}

export default function DiscordProvider ({ children }: Props) {

  const { user, setUser } = useUser();
  const { showMessage } = useSnackbar();
  const authCode = getCookie(AUTH_CODE_COOKIE);
  const authError = getCookie(AUTH_ERROR_COOKIE);

  const [discordError, setDiscordError] = useState('');
  const [isDisconnectingDiscord, setIsDisconnectingDiscord] = useState(false);
  const [isConnectDiscordLoading, setIsConnectDiscordLoading] = useState(false);

  const connectedWithDiscord = Boolean(user?.discordUser);

  async function connect () {
    if (!isConnectDiscordLoading) {
      if (connectedWithDiscord) {
        await disconnect();
      }
      else {
        window.location.replace(`/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=connect`);
      }
    }
    setIsDisconnectingDiscord(false);
  }

  function disconnect () {

    setIsDisconnectingDiscord(true);

    return charmClient.disconnectDiscord()
      .then(() => {
        setUser({ ...user, discordUser: null });
      })
      .catch(error => {
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
      setIsConnectDiscordLoading(true);

      charmClient.connectDiscord({
        code: authCode
      })
        .then(updatedUserFields => {
          setUser({ ...user, ...updatedUserFields });
        })
        .catch((err) => {
          setDiscordError(err.message || err.error || 'Something went wrong. Please try again');
        })
        .finally(() => {
          setIsConnectDiscordLoading(false);
        });
    }
  }, [user]);

  return children({
    isConnected: connectedWithDiscord,
    isLoading: !discordError && (!!authCode || isDisconnectingDiscord || isConnectDiscordLoading),
    connect,
    error: discordError
  });
}
