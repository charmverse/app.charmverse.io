import List from '@mui/material/List';
import { useEffect, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import { EmailAddressForm } from 'components/login/components/EmailAddressForm';
import { WalletSign } from 'components/login/components/WalletSign';
import { AddWalletStep } from 'components/settings/account/components/AddWalletStep';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCustomDomain } from 'hooks/useCustomDomain';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useGoogleLogin } from 'hooks/useGoogleLogin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import IdentityProviderItem from './IdentityProviderItem';
import { loginWithTelegram, TELEGRAM_BOT_ID } from './TelegramLoginIframe';

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
  const { isConnectingIdentity } = useWeb3ConnectionManager();
  const { account, isSigning, setAccountUpdatePaused } = useWeb3Account();
  const { user, setUser, updateUser } = useUser();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { requestMagicLinkViaFirebase } = useFirebaseAuth();
  const sendingMagicLink = useRef(false);
  const telegramAccount = user?.telegramUser?.account as Partial<TelegramAccount> | undefined;
  const [identityToAdd, setIdentityToAdd] = useState<'email' | 'wallet' | null>(null);
  const isUserWalletActive = !!user?.wallets?.some((w) => lowerCaseEqual(w.address, account));
  const { isOnCustomDomain } = useCustomDomain();
  const { loginWithGooglePopup, isConnectingGoogle } = useGoogleLogin();

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
      },
      onError(err) {
        showMessage((err as any).message ?? 'Something went wrong', 'error');
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

  const { connect, isConnected, isLoading: isDiscordLoading, popupLogin } = useDiscordConnection();

  async function handleConnectEmailRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      // console.log('Handling magic link request');
      try {
        if (space) {
          const isUserBannedFromSpace = await charmClient.members.checkSpaceBanStatus({
            spaceId: space.id,
            email
          });

          if (isUserBannedFromSpace.isBanned) {
            throw new Error('You need to leave space before you can add this email to your account');
          }
        }
        await requestMagicLinkViaFirebase({ email, connectToExistingAccount: true });
        showMessage(`Magic link sent. Please check your inbox for ${email}`, 'success');
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
                  if (isOnCustomDomain) {
                    popupLogin('/', 'connect');
                  } else {
                    connect();
                  }

                  onClose();
                }}
                disabled={isDiscordLoading}
              >
                Connect
              </PrimaryButton>
            </IdentityProviderItem>
          )}
          {!telegramAccount && !isOnCustomDomain && (
            <IdentityProviderItem type='Telegram'>
              <PrimaryButton
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
              </PrimaryButton>
            </IdentityProviderItem>
          )}
          {(!user?.googleAccounts || user.googleAccounts.length === 0) && (
            <IdentityProviderItem type='Google'>
              <PrimaryButton
                size='small'
                onClick={async () => {
                  loginWithGooglePopup({ type: 'connect' });
                  onClose();
                }}
                disabled={isConnectingGoogle}
              >
                Connect
              </PrimaryButton>
            </IdentityProviderItem>
          )}

          {!isOnCustomDomain && (
            <IdentityProviderItem type='VerifiedEmail'>
              <PrimaryButton size='small' onClick={() => setIdentityToAdd('email')} disabled={isConnectingGoogle}>
                Connect
              </PrimaryButton>
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
