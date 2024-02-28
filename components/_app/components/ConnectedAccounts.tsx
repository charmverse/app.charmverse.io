import { Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { WalletSign } from 'components/login/components/WalletSign';
import { TelegramLoginIframe } from 'components/settings/account/components/TelegramLoginIframe';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useGoogleLogin } from 'hooks/useGoogleLogin';
import { useTelegramConnect } from 'hooks/useTelegramConnect';
import { useUser } from 'hooks/useUser';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { DiscordAccount } from 'lib/discord/client/getDiscordAccount';
import { shortenHex } from 'lib/utils/blockchain';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { useRequiredMemberProperties } from '../../members/hooks/useRequiredMemberProperties';

function ConnectedAccount({
  icon,
  label,
  required,
  disabled,
  children,
  onClick,
  loading
}: {
  required: boolean;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  onClick?: VoidFunction;
  loading?: boolean;
}) {
  return (
    <Stack gap={1} minWidth={275} width='fit-content'>
      <FieldWrapper label={label} required={required}>
        <Button loading={loading} onClick={onClick} color='secondary' variant='outlined' disabled={disabled}>
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between' width='100%' gap={2}>
            {children}
            {!loading ? icon : null}
          </Stack>
        </Button>
      </FieldWrapper>
    </Stack>
  );
}

function DiscordAccountConnect({
  isDiscordRequired,
  connectedDiscordAccount,
  setIsOnboardingModalOpen
}: {
  setIsOnboardingModalOpen: (isOpen: boolean) => void;
  isDiscordRequired: boolean;
  connectedDiscordAccount?: LoggedInUser['discordUser'];
}) {
  const { isLoading: isDiscordLoading, popupLogin } = useDiscordConnection();
  return (
    <ConnectedAccount
      icon={<IdentityIcon type='Discord' size='small' />}
      label='Discord'
      required={isDiscordRequired}
      disabled={!!connectedDiscordAccount || isDiscordLoading}
      onClick={() => {
        setIsOnboardingModalOpen(true);
        popupLogin('/', 'connect');
      }}
    >
      {connectedDiscordAccount ? (
        <Typography variant='subtitle1'>
          Connected as {(connectedDiscordAccount.account as unknown as DiscordAccount)?.username}
        </Typography>
      ) : (
        <Typography variant='subtitle1'>Connect with Discord</Typography>
      )}
    </ConnectedAccount>
  );
}

function WalletConnect({
  isWalletRequired,
  connectedWallet,
  setIsOnboardingModalOpen
}: {
  isWalletRequired: boolean;
  connectedWallet?: LoggedInUser['wallets'][number];
  setIsOnboardingModalOpen: (isOpen: boolean) => void;
}) {
  const { updateUser } = useUser();

  const { trigger: signSuccess, isMutating: isVerifyingWallet } = useSWRMutation(
    '/profile/add-wallets',
    (_url, { arg }: Readonly<{ arg: AuthSig }>) => charmClient.addUserWallets([arg]),
    {
      onSuccess(data) {
        updateUser(data);
      }
    }
  );

  return connectedWallet ? (
    <ConnectedAccount
      icon={<IdentityIcon type='Wallet' size='small' />}
      required={isWalletRequired}
      disabled
      label='Wallet'
    >
      <Typography variant='subtitle1'>
        Connected as {connectedWallet.ensname ?? shortenHex(connectedWallet.address)}
      </Typography>
    </ConnectedAccount>
  ) : (
    <Stack gap={1} width={275}>
      <FieldWrapper label='Wallet' required={isWalletRequired}>
        <WalletSign
          onClick={() => {
            setIsOnboardingModalOpen(true);
          }}
          buttonSize='medium'
          buttonColor='secondary'
          signSuccess={signSuccess}
          buttonOutlined
        >
          {({ needsVerification, isLoading }) => {
            return (
              <Stack flexDirection='row' alignItems='center' justifyContent='space-between' width='100%'>
                {needsVerification ? (
                  <Typography variant='subtitle1'>Verify wallet</Typography>
                ) : (
                  <Typography variant='subtitle1'>Connect a wallet</Typography>
                )}
                {!isLoading && !isVerifyingWallet && <IdentityIcon type='Wallet' size='small' />}
              </Stack>
            );
          }}
        </WalletSign>
      </FieldWrapper>
    </Stack>
  );
}

function TelegramAccountConnect({
  isTelegramRequired,
  connectedTelegramAccount,
  setIsOnboardingModalOpen
}: {
  isTelegramRequired: boolean;
  connectedTelegramAccount?: LoggedInUser['telegramUser'];
  setIsOnboardingModalOpen: (isOpen: boolean) => void;
}) {
  const { connectTelegram, isConnectingToTelegram } = useTelegramConnect();

  return (
    <>
      <ConnectedAccount
        label='Telegram'
        icon={<IdentityIcon type='Telegram' size='small' />}
        required={isTelegramRequired}
        disabled={!!connectedTelegramAccount || isConnectingToTelegram}
        onClick={() => {
          setIsOnboardingModalOpen(true);
          connectTelegram();
        }}
      >
        {!connectedTelegramAccount ? (
          <Typography variant='subtitle1'>Connect with Telegram</Typography>
        ) : (
          <Typography variant='subtitle1'>
            Connected as {(connectedTelegramAccount.account as unknown as Partial<TelegramAccount>)?.username}
          </Typography>
        )}
      </ConnectedAccount>
      <TelegramLoginIframe />
    </>
  );
}

function GoogleAccountConnect({
  isGoogleRequired,
  connectedGoogleAccount,
  setIsOnboardingModalOpen
}: {
  isGoogleRequired: boolean;
  connectedGoogleAccount?: LoggedInUser['googleAccounts'][number];
  setIsOnboardingModalOpen: (isOpen: boolean) => void;
}) {
  const { loginWithGooglePopup, isConnectingGoogle } = useGoogleLogin();

  return (
    <ConnectedAccount
      label='Google'
      icon={<IdentityIcon type='Google' size='small' />}
      required={isGoogleRequired}
      disabled={!!connectedGoogleAccount || isConnectingGoogle}
      loading={isConnectingGoogle}
      onClick={() => {
        setIsOnboardingModalOpen(true);
        loginWithGooglePopup({ type: 'connect' });
      }}
    >
      {!connectedGoogleAccount ? (
        <Typography variant='subtitle1'>Connect with Google</Typography>
      ) : (
        <Typography variant='subtitle1'>Connected as {connectedGoogleAccount.name}</Typography>
      )}
    </ConnectedAccount>
  );
}

export function ConnectedAccounts({
  user,
  setIsOnboardingModalOpen
}: {
  user: LoggedInUser;
  setIsOnboardingModalOpen: (isOpen: boolean) => void;
}) {
  const { isGoogleRequired, isDiscordRequired, isWalletRequired, isTelegramRequired } = useRequiredMemberProperties({
    userId: user.id
  });

  const connectedGoogleAccount = user.googleAccounts?.[0];
  const connectedDiscordAccount = user.discordUser;
  const connectedTelegramAccount = user.telegramUser;
  const connectedWallet = user.wallets?.[0];

  return (
    <Stack gap={1}>
      <DiscordAccountConnect
        setIsOnboardingModalOpen={setIsOnboardingModalOpen}
        isDiscordRequired={isDiscordRequired}
        connectedDiscordAccount={connectedDiscordAccount}
      />
      <GoogleAccountConnect
        setIsOnboardingModalOpen={setIsOnboardingModalOpen}
        isGoogleRequired={isGoogleRequired}
        connectedGoogleAccount={connectedGoogleAccount}
      />
      <TelegramAccountConnect
        setIsOnboardingModalOpen={setIsOnboardingModalOpen}
        isTelegramRequired={isTelegramRequired}
        connectedTelegramAccount={connectedTelegramAccount}
      />
      <WalletConnect
        setIsOnboardingModalOpen={setIsOnboardingModalOpen}
        isWalletRequired={isWalletRequired}
        connectedWallet={connectedWallet}
      />
    </Stack>
  );
}
