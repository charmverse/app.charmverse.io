import { User } from '@prisma/client';
import styled from '@emotion/styled';
import { Alert, CircularProgress, Divider, Stack, SvgIcon, Tooltip, Typography } from '@mui/material';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { injected, walletConnect, walletLink } from 'connectors';
import { ReactNode, useContext, useEffect, useState } from 'react';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import useENSName from 'hooks/useENSName';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { getDisplayName } from 'lib/users';
import { LoggedInUser } from 'models';
import { useRouter } from 'next/router';
import { TelegramAccount } from 'pages/api/telegram/connect';
import DiscordIcon from 'public/images/discord_logo.svg';
import TelegramIcon from 'public/images/telegram_logo.svg';
import TelegramLoginIframe, { loginWithTelegram } from './TelegramLoginIframe';

const StyledButton = styled(Button)`
  width: 100px;
`;

const ImageIcon = styled.img`
  height: 48px;
  width: auto;
`;

function ProviderRow ({ children }: { children: ReactNode }) {
  return (
    <Stack
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      my={3}
      sx={{
        width: {
          lg: '500px'
        }
      }}
    >
      {children}
    </Stack>
  );
}

export default function IdentityProviders () {
  const { account, connector } = useWeb3React();
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const ENSName = useENSName(account);
  const [user, setUser] = useUser();
  const [isDisconnectingDiscord, setIsDisconnectingDiscord] = useState(false);
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [isLoggingOut] = useState(false);
  const [discordError, setDiscordError] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const router = useRouter();
  const isConnectingToDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'connect';
  const discordConnectFailed = router.query.discord === '2' && router.query.type === 'connect';
  const [isConnectDiscordLoading, setIsConnectDiscordLoading] = useState(false);
  const { showMessage } = useSnackbar();

  const connectedWithDiscord = Boolean(user?.discordUser);
  const connectedWithTelegram = Boolean(user?.telegramUser);

  useEffect(() => {
    if (discordConnectFailed === true) {
      showMessage('Failed to connect to discord');
    }
  }, [discordConnectFailed]);
  console.log('isConnectingToDiscord', isConnectingToDiscord, router.query);
  // We might get redirected after connection with discord, so check the query param if it has a discord field
  // It can either be fail or success
  useEffect(() => {
    // Connection with discord
    if (isConnectingToDiscord && user) {
      setIsConnectDiscordLoading(true);
      charmClient.connectDiscord({
        code: router.query.code as string
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
  }, []);

  const handleWalletProviderSwitch = () => {
    openWalletSelectorModal();
  };

  function connectorName (c: any) {
    switch (c) {
      case injected:
        return 'MetaMask';
      case walletConnect:
        return 'WalletConnect';
      case walletLink:
        return 'Coinbase Wallet';
      default:
        return '';
    }
  }

  async function connectWithDiscord () {
    if (!isConnectDiscordLoading) {
      if (connectedWithDiscord) {
        setIsDisconnectingDiscord(true);
        try {
          const updatedUser: User = await charmClient.disconnectDiscord();
          setUser({ ...user, ...updatedUser, discordUser: null });
        }
        catch (err) {
          log.warn('Error disconnecting from discord', err);
        }
        setIsDisconnectingDiscord(false);
      }
      else {
        window.location.replace(`/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=connect`);
      }
    }
    setIsDisconnectingDiscord(false);
  }

  async function disconnectFromTelegram () {
    if (connectedWithTelegram) {
      setIsConnectingTelegram(true);
      try {
        const updatedUser: User = await charmClient.disconnectTelegram();
        setUser((_user: LoggedInUser) => ({ ..._user, ...updatedUser, telegramUser: null }));
      }
      catch (err: any) {
        setTelegramError(err.message || err.error || 'Something went wrong. Please try again');
      }
      setIsConnectingTelegram(false);
    }
  }

  function connectToTelegram () {
    loginWithTelegram(async (telegramAccount: TelegramAccount) => {
      setIsConnectingTelegram(true);
      if (telegramAccount) {
        try {
          const telegramUser = await charmClient.connectTelegram(telegramAccount);
          setUser((_user: LoggedInUser) => ({ ..._user, telegramUser, username: telegramAccount.username, avatar: telegramAccount.photo_url }));
        }
        catch (err: any) {
          setTelegramError(err.message || err.error || 'Something went wrong. Please try again');
        }
      }
      else {
        setTelegramError('Something went wrong. Please try again');
      }
      setIsConnectingTelegram(false);
    });

  }

  const userName = ENSName || (user ? getDisplayName(user) : '');

  return (
    <>
      <Divider />

      <ProviderRow>
        <ImageIcon src='/walletLogos/metamask.png' />
        <Typography color='secondary'>
          {account ? `Connected with ${connectorName(connector)}` : 'Connect your wallet'}
        </Typography>
        <StyledButton size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          {account ? 'Switch' : 'Connect'}
        </StyledButton>
      </ProviderRow>

      <Divider />

      <ProviderRow>
        <SvgIcon sx={{ height: 48, width: 'auto' }}>
          <DiscordIcon />
        </SvgIcon>
        <Typography color='secondary'>
          {connectedWithDiscord ? 'Connected with Discord' : 'Connect with Discord'}
        </Typography>
        <Tooltip arrow placement='bottom' title={user?.addresses.length === 0 ? 'You must have at least one wallet address to disconnect from discord' : ''}>
          {/** div is used to make sure the tooltip is rendered as disabled button doesn't allow tooltip */}
          <div>
            <StyledButton
              size='small'
              variant='outlined'
              color={connectedWithDiscord ? 'error' : 'primary'}
              disabled={isLoggingOut || isDisconnectingDiscord || isConnectDiscordLoading || user?.addresses.length === 0}
              onClick={connectWithDiscord}
              endIcon={(
                isConnectDiscordLoading && <CircularProgress size={20} />
              )}
            >
              {connectedWithDiscord ? 'Disconnect' : 'Connect'}
            </StyledButton>
          </div>
        </Tooltip>
      </ProviderRow>

      {discordError && (
        <Alert severity='error'>
          {discordError}
        </Alert>
      )}

      <Divider />

      <ProviderRow>
        <SvgIcon sx={{ height: 48, width: 'auto' }}>
          <TelegramIcon />
        </SvgIcon>
        <Typography color='secondary'>
          {connectedWithTelegram ? 'Connected with Telegram' : 'Connect with Telegram'}
        </Typography>
        <StyledButton
          size='small'
          variant='outlined'
          sx={{ overflow: 'hidden' }}
          color={connectedWithTelegram ? 'error' : 'primary'}
          disabled={isLoggingOut || isConnectingTelegram}
          loading={isConnectingTelegram}
          onClick={() => connectedWithTelegram ? disconnectFromTelegram() : connectToTelegram()}
        >
          {connectedWithTelegram ? 'Disconnect' : 'Connect'}
        </StyledButton>
        <TelegramLoginIframe />
      </ProviderRow>

      {telegramError && (
        <Alert severity='error'>
          {telegramError}
        </Alert>
      )}
    </>

  );
}
