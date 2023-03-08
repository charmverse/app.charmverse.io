import RefreshIcon from '@mui/icons-material/Refresh';
import type { SelectChangeEvent } from '@mui/material';
import {
  Chip,
  Alert,
  Box,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import type { User } from '@prisma/client';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import { WalletSign } from 'components/login';
import Legend from 'components/settings/Legend';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import log from 'lib/log';
import { countConnectableIdentities } from 'lib/users/countConnectableIdentities';
import randomName from 'lib/utilities/randomName';
import { shortWalletAddress } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import IdentityProviderItem from './IdentityProviderItem';
import TelegramLoginIframe, { loginWithTelegram } from './TelegramLoginIframe';
import { useIdentityTypes } from './useIdentityTypes';

export default function IdentityProviders() {
  const { account, connectWallet, isConnectingIdentity, sign, isSigning, verifiableWalletDetected } = useWeb3AuthSig();
  const { user, setUser, updateUser } = useUser();
  const { showMessage } = useSnackbar();
  const { connectGoogleAccount, disconnectGoogleAccount, isConnectingGoogle } = useFirebaseAuth();
  const identityTypes = useIdentityTypes();
  const accountsPopupState = usePopupState({ variant: 'popover', popupId: 'accountsModal' });
  const verifyWalletPopupState = usePopupState({ variant: 'popover', popupId: 'verifyWalletModal' });
  const discordAccount = user?.discordUser?.account as Partial<DiscordAccount> | undefined;
  const telegramAccount = user?.telegramUser?.account as Partial<TelegramAccount> | undefined;

  const { trigger: saveUser, isMutating: isLoadingUserUpdate } = useSWRMutation(
    '/profile',
    (_url, { arg }: Readonly<{ arg: Partial<User> }>) => charmClient.updateUser(arg),
    {
      onSuccess(data) {
        updateUser({
          identityType: data.identityType,
          username: data.username
        });
      }
    }
  );

  const { trigger: signSuccess, isMutating: isVerifyingWallet } = useSWRMutation(
    '/profile/add-wallets',
    (_url, { arg }: Readonly<{ arg: AuthSig }>) => charmClient.addUserWallets([arg]),
    {
      onSuccess(data) {
        updateUser(data);
      }
    }
  );

  const generateWalletAuth = async () => {
    try {
      const authSig = await sign();
      await signSuccess(authSig);
    } catch (error) {
      log.error('Error requesting wallet signature in login page', error);
      showMessage('Wallet signature cancelled', 'info');
    }
  };

  const {
    trigger: disconnectFromTelegramm,
    isMutating: isDisconnectingTelegram,
    error: disconnectTelegramError
  } = useSWRMutation(telegramAccount ? '/telegram/disconnect' : null, () => charmClient.disconnectTelegram(), {
    onSuccess(data) {
      setUser((_user: LoggedInUser) => ({ ..._user, ...data, telegramUser: null }));
    }
  });

  const {
    trigger: connectToTelegramm,
    isMutating: isConnectingToTelegram,
    error: connectTelegramError
  } = useSWRMutation(
    telegramAccount ? '/telegram/connect' : null,
    () => charmClient.connectTelegram(telegramAccount as TelegramAccount),
    {
      onSuccess(data) {
        setUser((_user: LoggedInUser) => ({ ..._user, ...data, telegramUser: null }));
      }
    }
  );

  const telegramError =
    connectTelegramError?.message ||
    disconnectTelegramError?.message ||
    connectTelegramError?.error ||
    disconnectTelegramError?.error ||
    'Something went wrong. Please try again';

  async function connectTelegramm() {
    loginWithTelegram(async (_telegramAccount: TelegramAccount) => {
      if (_telegramAccount) {
        await connectToTelegramm(_telegramAccount);
      }
    });
  }

  const onIdentityChange = async (event: SelectChangeEvent<string>) => {
    const val = identityTypes.find((t) => t.username === event.target.value);

    if (val) {
      await saveUser({
        identityType: val.type,
        username: val.username
      });
    }
  };

  const { connect, isConnected, isLoading: isDiscordLoading, error } = useDiscordConnection();

  // Don't allow a user to remove their last identity
  const cannotDisconnect = !user || countConnectableIdentities(user) <= 1;

  const walletActionBtn: ReactNode = account ? (
    <MenuItem onClick={connectWallet}>Switch</MenuItem>
  ) : !verifiableWalletDetected || isConnectingIdentity ? (
    <MenuItem onClick={connectWallet}>Connect Wallet</MenuItem>
  ) : (
    <MenuItem onClick={generateWalletAuth}>Verify Wallet</MenuItem>
  );

  useEffect(() => {
    if (verifiableWalletDetected && !account) {
      verifyWalletPopupState.open();
    }
  }, [verifiableWalletDetected, account]);

  return (
    <>
      <Box mb={2}>
        <InputLabel sx={{ mb: 1 }}>
          Select your identity
          <br />
          <Typography variant='caption'>This is how you'll be references throughout CharmVerse</Typography>
        </InputLabel>
        <Box display='flex' alignItems='center'>
          <Select
            value={user?.username}
            onChange={onIdentityChange}
            disabled={isLoadingUserUpdate}
            sx={{ width: '400px', mr: 1 }}
          >
            {identityTypes.map((identity) => (
              <MenuItem key={identity.username} value={identity.username}>
                <Box display='flex' justifyContent='space-between' alignItems='center' width='100%'>
                  {identity.username}
                  <Chip variant='filled' label={identity.type} sx={{ ml: 2 }} />
                </Box>
              </MenuItem>
            ))}
          </Select>
          {user?.identityType === 'RandomName' && (
            <Tooltip title='Generate a new random name'>
              <IconButton
                onClick={() =>
                  saveUser({
                    identityType: 'RandomName',
                    username: randomName()
                  })
                }
                disabled={isLoadingUserUpdate}
              >
                <RefreshIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Legend>Connected Accounts</Legend>
      <TelegramLoginIframe />
      <List disablePadding aria-label='Connected accounts' sx={{ mb: 2 }}>
        {user?.wallets?.map((wallet) => (
          <IdentityProviderItem
            key={wallet.address}
            text={wallet.ensname || shortWalletAddress(wallet.address)}
            type='Wallet'
            loading={isConnectingIdentity || isVerifyingWallet || isSigning}
            disabled={cannotDisconnect}
            connected={true}
            actions={walletActionBtn}
          />
        ))}
        {isConnected && (
          <IdentityProviderItem
            text={discordAccount?.username}
            type='Discord'
            loading={isDiscordLoading}
            disabled={cannotDisconnect}
            connected={true}
            actions={<MenuItem onClick={connect}>Disconnect</MenuItem>}
            error={error && <Alert severity='error'>{error}</Alert>}
          />
        )}
        {telegramAccount && (
          <IdentityProviderItem
            text={telegramAccount?.username}
            type='Telegram'
            loading={isConnectingToTelegram || isDisconnectingTelegram}
            disabled={cannotDisconnect}
            connected={true}
            actions={<MenuItem onClick={disconnectFromTelegramm}>Disconnect</MenuItem>}
            error={telegramError && <Alert severity='error'>{telegramError}</Alert>}
          />
        )}
        {user?.googleAccounts?.map((acc) => (
          <IdentityProviderItem
            key={acc.email}
            text={acc.name}
            type='Google'
            loading={isConnectingGoogle}
            disabled={cannotDisconnect}
            connected={true}
            actions={<MenuItem onClick={disconnectGoogleAccount}>Disconnect</MenuItem>}
          />
        ))}
        <ListItem disablePadding>
          <ListItemIcon />
          <ListItemButton sx={{ flexGrow: 0 }} {...bindTrigger(accountsPopupState)}>
            + Add an account
          </ListItemButton>
        </ListItem>
      </List>
      <Modal
        open={accountsPopupState.isOpen}
        onClose={accountsPopupState.close}
        title='Add an account'
        aria-labelledby='Conect an account modal'
      >
        {(!user?.wallets || user.wallets.length === 0) && (
          <IdentityProviderItem
            type='Wallet'
            actions={walletActionBtn}
            loading={isConnectingIdentity || isVerifyingWallet || isSigning}
          />
        )}
        {!isConnected && (
          <IdentityProviderItem type='Discord' actions={<MenuItem onClick={connect}>Connect</MenuItem>} />
        )}
        {!telegramAccount && (
          <IdentityProviderItem
            type='Telegram'
            actions={<MenuItem onClick={connectTelegramm}>Connect Wallet</MenuItem>}
          />
        )}
        {(!user?.googleAccounts || user.googleAccounts.length === 0) && (
          <IdentityProviderItem type='Google' actions={<MenuItem onClick={connectGoogleAccount}>Connect</MenuItem>} />
        )}
        <Modal
          open={verifyWalletPopupState.isOpen}
          onClose={verifyWalletPopupState.close}
          title='Verify wallet'
          aria-labelledby='Verify wallet modal'
        >
          <Typography mb={2}>
            You need to verify your wallet in order to add it to your list of connected accounts.
          </Typography>
          <WalletSign
            signSuccess={async (authSig) => {
              await signSuccess(authSig);
              verifyWalletPopupState.close();
            }}
            loading={isVerifyingWallet || isSigning || isConnectingIdentity}
            enableAutosign={false}
          />
        </Modal>
      </Modal>
    </>
  );
}
