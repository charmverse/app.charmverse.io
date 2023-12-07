import { Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { useWalletSign } from 'components/login/components/WalletSign';
import { TelegramLoginIframe } from 'components/settings/account/components/TelegramLoginIframe';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCustomDomain } from 'hooks/useCustomDomain';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useGoogleLogin } from 'hooks/useGoogleLogin';
import { useTelegramConnect } from 'hooks/useTelegramConnect';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { DiscordAccount } from 'lib/discord/client/getDiscordAccount';
import { shortenHex } from 'lib/utilities/blockchain';
import type { LoggedInUser } from 'models';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { useRequiredMemberProperties } from '../hooks/useRequiredMemberProperties';

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
    <Stack gap={1} width={275}>
      <FieldWrapper label={label} required={required}>
        <Button
          loading={loading}
          onClick={onClick}
          color='secondary'
          sx={{
            cursor: 'pointer'
          }}
          variant='outlined'
          disabled={disabled}
        >
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between' width='100%'>
            {children}
            {!loading ? icon : null}
          </Stack>
        </Button>
      </FieldWrapper>
    </Stack>
  );
}

function DiscordAccountConnect({ user }: { user: LoggedInUser }) {
  const connectedDiscordAccount = user.discordUser;
  const { connect, isLoading: isDiscordLoading, popupLogin } = useDiscordConnection();
  const { isOnCustomDomain } = useCustomDomain();
  const { updateURLQuery } = useCharmRouter();

  const { isDiscordRequired } = useRequiredMemberProperties({
    userId: user.id
  });

  return (
    <ConnectedAccount
      icon={<IdentityIcon type='Discord' height={22} width={22} />}
      label='Discord'
      required={isDiscordRequired}
      disabled={!!connectedDiscordAccount || isDiscordLoading}
      onClick={() => {
        if (!isOnCustomDomain) {
          // Since this opens a new window, we need to keep the onboarding modal open via adding the onboarding query param
          updateURLQuery({ onboarding: true });
          popupLogin('/', 'connect');
        } else {
          connect({ onboarding: true });
        }
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

function WalletConnect({ user }: { user: LoggedInUser }) {
  const connectedWallet = user?.wallets?.[0];
  const { updateUser } = useUser();
  const { isConnectingIdentity } = useWeb3ConnectionManager();
  const { isSigning } = useWeb3Account();

  const { trigger: signSuccess, isMutating: isVerifyingWallet } = useSWRMutation(
    '/profile/add-wallets',
    (_url, { arg }: Readonly<{ arg: AuthSig }>) => charmClient.addUserWallets([arg]),
    {
      onSuccess(data) {
        updateUser(data);
      }
    }
  );

  const { isWalletSelectorModalOpen, verifiableWalletDetected, generateWalletAuth, connectWallet, showLoadingState } =
    useWalletSign({
      enableAutosign: false,
      signSuccess
    });

  const { isWalletRequired } = useRequiredMemberProperties({
    userId: user.id
  });

  const isConnectingWallet = isConnectingIdentity || isVerifyingWallet || isSigning;

  return (
    <ConnectedAccount
      label='Wallet'
      icon={<IdentityIcon type='Wallet' height={22} width={22} />}
      required={isWalletRequired}
      disabled={!!connectedWallet || isConnectingWallet}
      loading={showLoadingState || isConnectingWallet || isWalletSelectorModalOpen}
      onClick={() => {
        if (!verifiableWalletDetected || isConnectingIdentity) {
          connectWallet();
        } else {
          generateWalletAuth();
        }
      }}
    >
      {connectedWallet ? (
        <Typography variant='subtitle1'>Connected as {shortenHex(connectedWallet.address)}</Typography>
      ) : !verifiableWalletDetected || isConnectingIdentity ? (
        <Typography variant='subtitle1'>Connect a wallet</Typography>
      ) : (
        <Typography variant='subtitle1'>Verify wallet</Typography>
      )}
    </ConnectedAccount>
  );
}

function TelegramAccountConnect({ user }: { user: LoggedInUser }) {
  const connectedTelegramAccount = user?.telegramUser;
  const { connectTelegram, isConnectingToTelegram } = useTelegramConnect();
  const { updateURLQuery } = useCharmRouter();

  const { isTelegramRequired } = useRequiredMemberProperties({
    userId: user.id
  });

  return (
    <>
      <ConnectedAccount
        label='Telegram'
        icon={<IdentityIcon type='Telegram' height={22} width={22} />}
        required={isTelegramRequired}
        disabled={!!connectedTelegramAccount || isConnectingToTelegram}
        onClick={() => {
          updateURLQuery({ onboarding: true });
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

function GoogleAccountConnect({ user }: { user: LoggedInUser }) {
  const connectedGoogleAccount = user?.googleAccounts?.[0];
  const { loginWithGooglePopup, isConnectingGoogle } = useGoogleLogin();
  const { isGoogleRequired } = useRequiredMemberProperties({
    userId: user.id
  });
  const { updateURLQuery } = useCharmRouter();

  return (
    <ConnectedAccount
      label='Google'
      icon={<IdentityIcon type='Google' height={22} width={22} />}
      required={isGoogleRequired}
      disabled={!!connectedGoogleAccount || isConnectingGoogle}
      loading={isConnectingGoogle}
      onClick={() => {
        updateURLQuery({ onboarding: true });
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

export function ConnectedAccounts() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <Stack gap={1}>
      <DiscordAccountConnect user={user} />
      <GoogleAccountConnect user={user} />
      <TelegramAccountConnect user={user} />
      <WalletConnect user={user} />
    </Stack>
  );
}
