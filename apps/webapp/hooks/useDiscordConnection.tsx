import { log } from '@charmverse/core/log';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from '@packages/lib/discord/constants';
import { getDiscordLoginPath } from '@packages/lib/discord/getDiscordLoginPath';
import { getCookie, deleteCookie } from '@packages/lib/utils/browser';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { usePopupLogin } from 'hooks/usePopupLogin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { useRoles } from './useRoles';
import { useVerifyLoginOtp } from './useVerifyLoginOtp';

interface Props {
  children: JSX.Element;
}

type IDiscordConnectionContext = {
  isConnected: boolean;
  isLoading: boolean;
  disconnect: () => Promise<void> | void;
  error?: string;
  popupLogin: (redirectUrl: string, type: 'login' | 'connect') => void;
  popupServer: (redirectUrl: string, spaceId: string) => void;
};

export const DiscordConnectionContext = createContext<Readonly<IDiscordConnectionContext>>({
  disconnect: () => {},
  popupLogin: () => {},
  popupServer: () => {},
  error: undefined,
  isConnected: false,
  isLoading: false
});

export function DiscordProvider({ children }: Props) {
  const { user, updateUser } = useUser();
  const { showMessage } = useSnackbar();
  const authCode = getCookie(AUTH_CODE_COOKIE);
  const authError = getCookie(AUTH_ERROR_COOKIE);
  const [discordError, setDiscordError] = useState('');
  const [isDisconnectingDiscord, setIsDisconnectingDiscord] = useState(false);
  const [isConnectDiscordLoading, setIsConnectDiscordLoading] = useState(false);

  const connectedWithDiscord = Boolean(user?.discordUser);
  const { openPopupLogin } = usePopupLogin<{ code: string }>();
  const { open: openVerifyOtpModal } = useVerifyLoginOtp();
  const { refreshRoles } = useRoles();

  async function disconnect() {
    if (!isConnectDiscordLoading && connectedWithDiscord) {
      setIsDisconnectingDiscord(true);

      return charmClient.discord
        .disconnectDiscord()
        .then(() => {
          updateUser({ discordUser: null });
        })
        .catch((error) => {
          log.warn('Error disconnecting from discord', error);
        })
        .finally(() => {
          setIsDisconnectingDiscord(false);
        });
    }
  }

  function popupLogin(redirectUrl: string, type: 'login' | 'connect') {
    const discordLoginPath = getDiscordLoginPath({
      type,
      redirectUrl,
      authFlowType: 'popup'
    });

    const loginCallback = async ({ code }: { code: string | null }) => {
      if (!code) {
        return;
      }

      try {
        if (type === 'connect') {
          const updatedUser = await charmClient.discord.connectDiscord({ code }, 'popup').catch((err) => {
            setDiscordError(err.message || err.error || 'Something went wrong. Please try again');
          });

          updateUser({ ...updatedUser });
        } else {
          const resp = await charmClient.discord.loginWithDiscordCode(code);
          if ('id' in resp) {
            updateUser(resp);
          } else {
            openVerifyOtpModal();
          }
        }
      } catch (e: any) {
        showMessage(e.message || 'Failed to login with discord', 'error');
      }
    };

    openPopupLogin(discordLoginPath, loginCallback);
  }

  function popupServer(redirectUrl: string, spaceId: string) {
    const discordLoginPath = getDiscordLoginPath({
      type: 'server',
      redirectUrl,
      authFlowType: 'popup'
    });

    const serverCallback = async ({ code, guildId }: { code: string | null; guildId?: string | null }) => {};

    openPopupLogin(discordLoginPath, serverCallback);
  }

  useEffect(() => {
    if (authError) {
      deleteCookie(AUTH_ERROR_COOKIE);
      showMessage('Failed to connect to discord', 'error');
    }
  }, [authError]);

  useEffect(() => {
    if (discordError) {
      showMessage(discordError, 'error');
      setDiscordError('');
    }
  }, [discordError]);

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
            updateUser({ ...updatedUserFields });
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
      disconnect,
      error,
      popupLogin,
      popupServer
    }),
    [isConnected, isLoading, error]
  );

  return <DiscordConnectionContext.Provider value={value}>{children}</DiscordConnectionContext.Provider>;
}

export const useDiscordConnection = () => useContext(DiscordConnectionContext);
