import RefreshIcon from '@mui/icons-material/Refresh';
import type { SelectChangeEvent } from '@mui/material';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import type { User } from '@prisma/client';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { Fragment } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
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
import { NewIdentityModal } from './NewIdentityModal';
import { TelegramLoginIframe } from './TelegramLoginIframe';
import { useIdentityTypes } from './useIdentityTypes';

export function IdentityProviders() {
  const { account, isConnectingIdentity, sign, isSigning, verifiableWalletDetected, disconnectWallet } =
    useWeb3AuthSig();
  const { user, setUser, updateUser } = useUser();
  const { showMessage } = useSnackbar();
  const { disconnectGoogleAccount, isConnectingGoogle, disconnectVerifiedEmailAccount } = useFirebaseAuth();
  const identityTypes = useIdentityTypes();
  const accountsPopupState = usePopupState({ variant: 'popover', popupId: 'accountsModal' });
  const deleteWalletPopupState = usePopupState({ variant: 'popover', popupId: 'deleteWalletModal' });
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
    trigger: disconnectFromTelegram,
    isMutating: isDisconnectingTelegram,
    error: disconnectTelegramError
  } = useSWRMutation(telegramAccount ? '/telegram/disconnect' : null, () => charmClient.disconnectTelegram(), {
    onSuccess(data) {
      setUser((_user: LoggedInUser) => ({ ..._user, ...data, telegramUser: null }));
    }
  });

  const { error: connectTelegramError, isMutating: isConnectingToTelegram } = useSWRMutation(
    '/telegram/connect',
    (_url, { arg }: Readonly<{ arg: TelegramAccount }>) => charmClient.connectTelegram(arg),
    {
      onSuccess(data) {
        setUser((_user: LoggedInUser) => ({ ..._user, telegramUser: data }));
      }
    }
  );

  const telegramError =
    connectTelegramError?.message ||
    disconnectTelegramError?.message ||
    connectTelegramError?.error ||
    disconnectTelegramError?.error;

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

  return (
    <>
      <Box mb={2}>
        <InputLabel sx={{ mb: 1 }}>
          Select your identity
          <br />
          <Typography variant='caption'>This is how you'll be referred to throughout CharmVerse</Typography>
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
                  <Chip variant='filled' label={identity.type.replace(/([A-Z])/g, ' $1').trim()} sx={{ ml: 2 }} />
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
          <Fragment key={wallet.address}>
            <IdentityProviderItem
              text={wallet.ensname || shortWalletAddress(wallet.address)}
              type='Wallet'
              loading={isConnectingIdentity || isVerifyingWallet || isSigning}
              disabled={cannotDisconnect}
              connected={true}
              actions={[
                verifiableWalletDetected && !account && !isConnectingIdentity ? (
                  <MenuItem key='verify' onClick={generateWalletAuth}>
                    Verify Wallet
                  </MenuItem>
                ) : null,
                <MenuItem key='disconnect' onClick={deleteWalletPopupState.open}>
                  Disconnect Wallet
                </MenuItem>
              ]}
            />
            <ConfirmDeleteModal
              title='Disconnect wallet'
              question={
                <>
                  <Typography mb={1}>
                    Are you sure you want to Disconnect your {wallet.ensname || wallet.address} wallet?
                  </Typography>
                  <Typography variant='body2'>
                    This action will remove your wallet, NFTs, POAPs, Organizations from CharmVerse. It will also remove
                    roles and permissions if you joined the Space via a token gate.
                  </Typography>
                </>
              }
              buttonText='Disconnect'
              onConfirm={() => disconnectWallet(wallet.address)}
              onClose={deleteWalletPopupState.close}
              open={deleteWalletPopupState.isOpen}
            />
          </Fragment>
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
            disabled={!user}
            connected={true}
            actions={<MenuItem onClick={disconnectFromTelegram}>Disconnect</MenuItem>}
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
        {user?.verifiedEmails?.map((verifiedEmail) => (
          <IdentityProviderItem
            key={verifiedEmail.email}
            text={verifiedEmail.email}
            type='VerifiedEmail'
            loading={false}
            disabled={cannotDisconnect}
            connected={true}
            actions={
              <MenuItem onClick={() => disconnectVerifiedEmailAccount(verifiedEmail.email)}>Disconnect</MenuItem>
            }
          />
        ))}
        <ListItem disablePadding>
          <ListItemButton sx={{ flexGrow: 0 }} {...bindTrigger(accountsPopupState)}>
            + Add an account
          </ListItemButton>
        </ListItem>
      </List>
      <NewIdentityModal isOpen={accountsPopupState.isOpen} onClose={accountsPopupState.close} />
    </>
  );
}
