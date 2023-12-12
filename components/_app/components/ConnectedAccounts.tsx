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

function DiscordAccountConnect({
  isDiscordRequired,
  connectedDiscordAccount
}: {
  isDiscordRequired: boolean;
  connectedDiscordAccount?: LoggedInUser['discordUser'];
}) {
  const { isLoading: isDiscordLoading, popupLogin } = useDiscordConnection();
  const { updateURLQuery } = useCharmRouter();
  return (
    <ConnectedAccount
      icon={<IdentityIcon type='Discord' size='small' />}
      label='Discord'
      required={isDiscordRequired}
      disabled={!!connectedDiscordAccount || isDiscordLoading}
      onClick={() => {
        updateURLQuery({ onboarding: true });
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
  connectedWallet
}: {
  isWalletRequired: boolean;
  connectedWallet?: LoggedInUser['wallets'][number];
}) {
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

  const isConnectingWallet = isConnectingIdentity || isVerifyingWallet || isSigning;

  return (
    <ConnectedAccount
      label='Wallet'
      icon={<IdentityIcon type='Wallet' size='small' />}
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

function TelegramAccountConnect({
  isTelegramRequired,
  connectedTelegramAccount
}: {
  isTelegramRequired: boolean;
  connectedTelegramAccount?: LoggedInUser['telegramUser'];
}) {
  const { connectTelegram, isConnectingToTelegram } = useTelegramConnect();
  const { updateURLQuery } = useCharmRouter();

  return (
    <>
      <ConnectedAccount
        label='Telegram'
        icon={<IdentityIcon type='Telegram' size='small' />}
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

function GoogleAccountConnect({
  isGoogleRequired,
  connectedGoogleAccount
}: {
  isGoogleRequired: boolean;
  connectedGoogleAccount?: LoggedInUser['googleAccounts'][number];
}) {
  const { loginWithGooglePopup, isConnectingGoogle } = useGoogleLogin();

  const { updateURLQuery } = useCharmRouter();

  return (
    <ConnectedAccount
      label='Google'
      icon={<IdentityIcon type='Google' size='small' />}
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

export function ConnectedAccounts({ user }: { user: LoggedInUser }) {
  const { isGoogleRequired, isDiscordRequired, isWalletRequired, isTelegramRequired } = useRequiredMemberProperties({
    userId: user.id
  });

  const connectedGoogleAccount = user.googleAccounts?.[0];
  const connectedDiscordAccount = user.discordUser;
  const connectedTelegramAccount = user.telegramUser;
  const connectedWallet = user.wallets?.[0];

  return (
    <Stack gap={1}>
      <DiscordAccountConnect isDiscordRequired={isDiscordRequired} connectedDiscordAccount={connectedDiscordAccount} />
      <GoogleAccountConnect isGoogleRequired={isGoogleRequired} connectedGoogleAccount={connectedGoogleAccount} />
      <TelegramAccountConnect
        isTelegramRequired={isTelegramRequired}
        connectedTelegramAccount={connectedTelegramAccount}
      />
      <WalletConnect isWalletRequired={isWalletRequired} connectedWallet={connectedWallet} />
    </Stack>
  );
}
