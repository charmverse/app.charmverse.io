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
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import type { User } from '@prisma/client';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login';
import { CollectEmail, CollectEmailDialog } from 'components/login/CollectEmail';
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
import { TelegramLoginIframe, loginWithTelegram } from './TelegramLoginIframe';
import { useIdentityTypes } from './useIdentityTypes';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function NewIdentityModal({ isOpen, onClose }: Props) {
  const { account, isConnectingIdentity, sign, isSigning, verifiableWalletDetected } = useWeb3AuthSig();
  const { user, setUser, updateUser } = useUser();
  const { showMessage } = useSnackbar();
  const { connectGoogleAccount, disconnectGoogleAccount, isConnectingGoogle, requestMagicLinkViaFirebase } =
    useFirebaseAuth();
  const sendingMagicLink = useRef(false);
  const identityTypes = useIdentityTypes();
  const telegramAccount = user?.telegramUser?.account as Partial<TelegramAccount> | undefined;

  const [identityToAdd, setIdentityToAdd] = useState<'email' | null>(null);

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
  const { trigger: connectToTelegram, isMutating: isConnectingToTelegram } = useSWRMutation(
    '/telegram/connect',
    (_url, { arg }: Readonly<{ arg: TelegramAccount }>) => charmClient.connectTelegram(arg),
    {
      onSuccess(data) {
        setUser((_user: LoggedInUser) => ({ ..._user, telegramUser: data }));
      }
    }
  );

  async function connectTelegram() {
    loginWithTelegram(async (_telegramAccount: TelegramAccount) => {
      if (_telegramAccount) {
        await connectToTelegram(_telegramAccount);
      } else {
        showMessage('Something went wrong. Please try again', 'warning');
      }
    });
  }

  const { connect, isConnected, isLoading: isDiscordLoading } = useDiscordConnection();

  async function handleConnectEmailRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      // console.log('Handling magic link request');
      try {
        await requestMagicLinkViaFirebase({ email, connectToExistingAccount: true });
        onClose();
        setIdentityToAdd(null);
      } catch (err) {
        showMessage((err as any).message ?? 'Something went wrong', 'error');
      } finally {
        sendingMagicLink.current = false;
      }
    }
  }

  function close() {
    if (identityToAdd) {
      setIdentityToAdd(null);
    } else {
      onClose();
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={!identityToAdd ? 'Add an account' : ''}
      aria-labelledby='Conect an account modal'
      size='600px'
    >
      {!identityToAdd && (
        <List disablePadding aria-label='Connect accounts' sx={{ '& .MuiButton-root': { width: '140px' } }}>
          {(!user?.wallets || user.wallets.length === 0) && (
            <IdentityProviderItem type='Wallet' loading={isConnectingIdentity || isVerifyingWallet || isSigning}>
              {account ? null : (
                <WalletSign
                  buttonSize='small'
                  signSuccess={async (authSig) => {
                    await signSuccess(authSig);
                    onClose();
                  }}
                  loading={isVerifyingWallet || isSigning || isConnectingIdentity}
                  enableAutosign={false}
                />
              )}
            </IdentityProviderItem>
          )}
          {!isConnected && (
            <IdentityProviderItem type='Discord'>
              <PrimaryButton
                size='small'
                onClick={() => {
                  connect();
                  onClose();
                }}
                disabled={isDiscordLoading}
              >
                Connect
              </PrimaryButton>
            </IdentityProviderItem>
          )}
          {!telegramAccount && (
            <IdentityProviderItem type='Telegram'>
              <PrimaryButton
                size='small'
                onClick={async () => {
                  await connectTelegram();
                  onClose();
                }}
                disabled={isConnectingToTelegram}
              >
                Connect
              </PrimaryButton>
            </IdentityProviderItem>
          )}
          {(!user?.googleAccounts || user.googleAccounts.length === 0) && (
            <IdentityProviderItem type='Google'>
              <PrimaryButton
                size='small'
                onClick={async () => {
                  await connectGoogleAccount();
                  onClose();
                }}
                disabled={isConnectingGoogle}
              >
                Connect
              </PrimaryButton>
            </IdentityProviderItem>
          )}

          <IdentityProviderItem type='VerifiedEmail'>
            <PrimaryButton size='small' onClick={() => setIdentityToAdd('email')} disabled={isConnectingGoogle}>
              Connect
            </PrimaryButton>
          </IdentityProviderItem>
        </List>
      )}
      {identityToAdd === 'email' && (
        <CollectEmail
          description='Enter the email address that you want to connect to this account'
          handleSubmit={handleConnectEmailRequest}
          title='Connect email address'
          onClose={close}
        />
      )}
    </Modal>
  );
}
