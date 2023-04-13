import List from '@mui/material/List';
import { useEffect, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import { AddWalletStep } from 'components/integrations/components/AddWalletStep';
import { WalletSign } from 'components/login';
import { CollectEmail } from 'components/login/CollectEmail';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import IdentityProviderItem from './IdentityProviderItem';
import { loginWithTelegram } from './TelegramLoginIframe';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type IdentityStepToAdd = 'wallet' | 'email';

const modalTitles: Record<IdentityStepToAdd, string> = {
  wallet: 'Connect wallet address',
  email: 'Connect email address'
};

export function NewIdentityModal({ isOpen, onClose }: Props) {
  const { account, isConnectingIdentity, isSigning, setAccountUpdatePaused } = useWeb3AuthSig();
  const { user, setUser, updateUser } = useUser();
  const { showMessage } = useSnackbar();
  const { connectGoogleAccount, isConnectingGoogle, requestMagicLinkViaFirebase } = useFirebaseAuth();
  const sendingMagicLink = useRef(false);
  const telegramAccount = user?.telegramUser?.account as Partial<TelegramAccount> | undefined;
  const [identityToAdd, setIdentityToAdd] = useState<'email' | 'wallet' | null>(null);

  const { trigger: signSuccess, isMutating: isVerifyingWallet } = useSWRMutation(
    '/profile/add-wallets',
    (_url, { arg }: Readonly<{ arg: AuthSig }>) => charmClient.addUserWallets([arg]),
    {
      onSuccess(data) {
        updateUser(data);
      }
    }
  );

  const isConnectingWallet = isConnectingIdentity || isVerifyingWallet || isSigning;

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

  async function onSignSuccess(authSig: AuthSig) {
    try {
      await signSuccess(authSig);
      onClose();
    } catch (e: any) {
      showMessage(e.message || 'Something went wrong', 'error');
    }
  }

  useEffect(() => {
    setAccountUpdatePaused(isOpen);
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={!identityToAdd ? 'Add an account' : modalTitles[identityToAdd]}
      aria-labelledby='Conect an account modal'
      size='600px'
    >
      {!identityToAdd && (
        <List disablePadding aria-label='Connect accounts' sx={{ '& .MuiButton-root': { width: '140px' } }}>
          {!user?.wallets || user.wallets.length === 0 ? (
            <IdentityProviderItem type='Wallet' loading={isConnectingWallet}>
              <WalletSign
                buttonSize='small'
                signSuccess={onSignSuccess}
                loading={isVerifyingWallet || isSigning || isConnectingIdentity}
                enableAutosign={false}
              />
            </IdentityProviderItem>
          ) : (
            <IdentityProviderItem
              type='Wallet'
              loading={isConnectingIdentity || isVerifyingWallet || isSigning}
              text='Add wallet address'
            >
              <PrimaryButton size='small' onClick={() => setIdentityToAdd('wallet')} disabled={isConnectingWallet}>
                Connect
              </PrimaryButton>
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
        />
      )}

      {identityToAdd === 'wallet' && (
        <AddWalletStep isConnectingWallet={isConnectingWallet} onSignSuccess={onSignSuccess} />
      )}
    </Modal>
  );
}
