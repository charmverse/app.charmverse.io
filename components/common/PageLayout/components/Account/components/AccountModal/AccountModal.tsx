
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import CopyableAddress from 'components/common/CopyableAddress';
import { Avatar } from 'components/common/Avatar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { Modal, DialogTitle } from 'components/common/Modal';
import { injected, walletConnect, walletLink } from 'connectors';
import { useContext, useState, useEffect } from 'react';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import useENSName from 'hooks/useENSName';
import { useSnackbar } from 'hooks/useSnackbar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import styled from '@emotion/styled';
import { CircularProgress, Tooltip } from '@mui/material';
import charmClient from 'charmClient';
import { getDisplayName } from 'lib/users';
import log from 'lib/log';
import { LoggedInUser } from 'models';
import { TelegramAccount } from 'pages/api/telegram/connect';
import TelegramLoginIframe, { loginWithTelegram } from './components/TelegramLoginIframe';

const UserName = styled(Typography)`
  position: relative;
  top: 4px;
`;

const StyledButton = styled(Button)`
  width: 100px;
`;

function AccountModal ({ isOpen, onClose }:
  { isOpen: boolean, onClose: () => void }) {
  const { account, connector } = useWeb3React();
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const ENSName = useENSName(account);
  const [user, setUser] = useUser();
  const [isDisconnectingDiscord, setIsDisconnectingDiscord] = useState(false);
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [isLoggingOut, setisLoggingOut] = useState(false);
  const [discordError, setDiscordError] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const router = useRouter();
  const [space] = useCurrentSpace();
  const isConnectingToDiscord = space && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'connect';
  const discordConnectFailed = space && router.query.discord === '2' && router.query.type === 'connect';
  const [isConnectDiscordLoading, setIsConnectDiscordLoading] = useState(false);
  const { showMessage } = useSnackbar();

  const connectedWithDiscord = Boolean(user?.discordUser);
  const connectedWithTelegram = Boolean(user?.telegramUser);

  useEffect(() => {
    if (discordConnectFailed === true) {
      showMessage('Failed to connect to discord');
    }
  }, [discordConnectFailed]);

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
    onClose();
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
          await charmClient.disconnectDiscord();
          setUser({ ...user, discordUser: null });
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
        await charmClient.disconnectTelegram();
        setUser((_user: LoggedInUser) => ({ ..._user, telegramUser: null }));
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

  function _onClose () {
    router.replace(window.location.href.split('?')[0], undefined, { shallow: true });
    onClose();
  }

  const userName = ENSName || (user ? getDisplayName(user) : '');

  return (
    <Modal open={isConnectingToDiscord || isOpen} onClose={_onClose}>
      <DialogTitle onClose={_onClose}>Account</DialogTitle>
      {user && user?.addresses.length !== 0 && (
        <Stack mb={2} direction='row' spacing='4' alignItems='center'>
          <Avatar name={userName} avatar={user.avatar} />
          <CopyableAddress address={user.addresses[0]} decimals={5} sx={{ fontSize: 24 }} />
          {user.username && <UserName variant='subtitle2'>{user.username}</UserName>}
        </Stack>
      )}
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
        <Typography color='secondary'>
          {account ? `Connected with ${connectorName(connector)}` : 'Connect with Metamask'}
        </Typography>
        <StyledButton size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          {account ? 'Switch' : 'Connect'}
        </StyledButton>
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
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
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
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
      </Stack>
      {telegramError && (
        <Alert severity='error'>
          {telegramError}
        </Alert>
      )}
      {discordError && (
        <Alert severity='error'>
          {discordError}
        </Alert>
      )}
      {/* user cant be logged out so long as their wallet is connected (TODO: fix!) */}
      {!account && (
        <Box display='flex' justifyContent='flex-end' mt={2}>
          <StyledButton
            size='small'
            variant='outlined'
            color='secondary'
            loading={isLoggingOut}
            onClick={async () => {
              setisLoggingOut(true);
              await charmClient.logout();
              setUser(null);
              router.push('/');
            }}
          >
            Logout
          </StyledButton>
        </Box>
      )}
    </Modal>
  );
}

export default AccountModal;
