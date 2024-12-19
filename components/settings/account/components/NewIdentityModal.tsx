import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterAccount } from '@farcaster/auth-kit';
import List from '@mui/material/List';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { useAddUserWallets } from 'charmClient/hooks/profile';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { EmailAddressForm } from 'components/login/components/EmailAddressForm';
import { WalletSign } from 'components/login/components/WalletSign';
import { AddWalletStep } from 'components/settings/account/components/AddWalletStep';
import { useCustomDomain } from 'hooks/useCustomDomain';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useGoogleLogin } from 'hooks/useGoogleLogin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useTelegramConnect } from 'hooks/useTelegramConnect';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SignatureVerificationPayload } from 'lib/blockchain/signAndVerify';
import type { TelegramAccount } from 'lib/telegram/interfaces';
import { lowerCaseEqual } from 'lib/utils/strings';

import IdentityProviderItem from './IdentityProviderItem';
import { TELEGRAM_BOT_ID, TelegramLoginIframe } from './TelegramLoginIframe';

const WarpcastLogin = dynamic(
  () => import('components/login/components/WarpcastLogin').then((module) => module.WarpcastLogin),
  { ssr: false }
);

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
  const { account, isSigning, setAccountUpdatePaused } = useWeb3Account();
  const { user, updateUser } = useUser();
  const { showMessage } = useSnackbar();
  const { requestMagicLinkViaFirebase } = useFirebaseAuth();
  const sendingMagicLink = useRef(false);
  const telegramAccount = user?.telegramUser?.account as Partial<TelegramAccount> | undefined;
  const farcasterAccount = user?.farcasterUser?.account as Partial<FarcasterAccount> | undefined;
  const [identityToAdd, setIdentityToAdd] = useState<'email' | 'wallet' | null>(null);
  const isUserWalletActive = !!user?.wallets?.some((w) => lowerCaseEqual(w.address, account));
  const { isOnCustomDomain } = useCustomDomain();
  const { loginWithGooglePopup, isConnectingGoogle } = useGoogleLogin();

  const { trigger: signSuccess, isMutating: isVerifyingWallet } = useAddUserWallets();

  const isConnectingWallet = isVerifyingWallet || isSigning;

  const { connectTelegram, isConnectingToTelegram } = useTelegramConnect();

  const { isConnected, isLoading: isDiscordLoading, popupLogin } = useDiscordConnection();

  async function handleConnectEmailRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      try {
        await requestMagicLinkViaFirebase({ email, connectToExistingAccount: true });
        showMessage(`Magic link sent. Please check your inbox for ${email}`, 'success');
        onClose();
        setIdentityToAdd(null);
      } catch (err) {
        showMessage((err as any).message ?? 'Something went wrong', 'error');
        log.error('Error sending magic link in identity modal.', { error: err });
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

  async function onSignSuccess(payload: SignatureVerificationPayload) {
    await signSuccess(
      { ...payload, address: account as string },
      {
        onSuccess: async (data) => {
          await updateUser(data);
          onClose();
        },
        onError: (e) => {
          onClose();
          showMessage(e.message || 'Something went wrong', 'error');
        }
      }
    );
  }

  useEffect(() => {
    setAccountUpdatePaused(isOpen);
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={!isUserWalletActive && identityToAdd === 'wallet' && !!account ? undefined : close}
      title={!identityToAdd ? 'Add an account' : modalTitles[identityToAdd]}
      aria-labelledby='Connect an account modal'
      size='600px'
    >
      {!identityToAdd && (
        <List disablePadding aria-label='Connect accounts' sx={{ '& .MuiButton-root': { width: '140px' } }}>
          {!user?.wallets || user.wallets.length === 0 ? (
            <IdentityProviderItem type='Wallet' loading={isConnectingWallet}>
              <WalletSign
                buttonSize='small'
                signSuccess={onSignSuccess}
                loading={isConnectingWallet}
                enableAutosign={false}
              />
            </IdentityProviderItem>
          ) : (
            <IdentityProviderItem type='Wallet' loading={isConnectingWallet} text='Add wallet address'>
              <Button
                color='primary'
                size='small'
                onClick={() => setIdentityToAdd('wallet')}
                disabled={isConnectingWallet}
              >
                Connect
              </Button>
            </IdentityProviderItem>
          )}
          {!isConnected && (
            <IdentityProviderItem type='Discord'>
              <Button
                color='primary'
                size='small'
                onClick={() => {
                  popupLogin('/', 'connect');
                  onClose();
                }}
                disabled={isDiscordLoading}
              >
                Connect
              </Button>
            </IdentityProviderItem>
          )}
          {!telegramAccount && !isOnCustomDomain && (
            <IdentityProviderItem type='Telegram'>
              <Button
                color='primary'
                disabled={!TELEGRAM_BOT_ID}
                loading={isConnectingToTelegram}
                disabledTooltip='Telegram bot is not configured'
                size='small'
                onClick={async () => {
                  await connectTelegram();
                  onClose();
                }}
              >
                Connect
                <TelegramLoginIframe />
              </Button>
            </IdentityProviderItem>
          )}
          {!farcasterAccount && (
            <IdentityProviderItem type='Farcaster'>
              <WarpcastLogin type='connect' />
            </IdentityProviderItem>
          )}
          {(!user?.googleAccounts || user.googleAccounts.length === 0) && (
            <IdentityProviderItem type='Google'>
              <Button
                color='primary'
                size='small'
                onClick={() => {
                  loginWithGooglePopup({ type: 'connect' });
                  onClose();
                }}
                disabled={isConnectingGoogle}
              >
                Connect
              </Button>
            </IdentityProviderItem>
          )}

          {!isOnCustomDomain && (
            <IdentityProviderItem type='VerifiedEmail'>
              <Button
                color='primary'
                size='small'
                onClick={() => setIdentityToAdd('email')}
                disabled={isConnectingGoogle}
              >
                Connect
              </Button>
            </IdentityProviderItem>
          )}
        </List>
      )}

      {identityToAdd === 'email' && (
        <EmailAddressForm
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
