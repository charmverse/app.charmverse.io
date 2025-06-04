import { AuthKitProvider } from '@farcaster/auth-kit';
import { Typography } from '@mui/material';
import type { FarcasterProfile } from '@packages/farcaster/getFarcasterProfile';
import { warpcastConfig } from '@packages/lib/farcaster/config';
import type { LoggedInUser } from '@packages/profile/getUser';

import { FarcasterLoginModal } from 'components/login/components/FarcasterModal';
import { useWarpcastLogin } from 'components/login/hooks/useWarpcastLogin';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';

import { ConnectedAccount } from './ConnectedAccount';

function FarcasterConnect({
  isFarcasterRequired,
  connectedFarcasterAccount
}: {
  isFarcasterRequired: boolean;
  connectedFarcasterAccount?: LoggedInUser['farcasterUser'];
}) {
  const { close, isLoading, isOpen, signIn, url } = useWarpcastLogin({
    type: 'connect'
  });

  const farcasterProfile = connectedFarcasterAccount?.account as FarcasterProfile['body'];

  return (
    <ConnectedAccount
      label='Farcaster'
      required={isFarcasterRequired}
      disabled={!!connectedFarcasterAccount || isLoading}
      onClick={signIn}
      loading={isLoading}
      icon={<IdentityIcon type='Farcaster' size='small' />}
    >
      {!farcasterProfile ? (
        <Typography variant='subtitle1'>Connect with Farcaster</Typography>
      ) : (
        <Typography variant='subtitle1'>Connected as {farcasterProfile.username}</Typography>
      )}
      <FarcasterLoginModal open={isOpen} onClose={close} url={url} />
    </ConnectedAccount>
  );
}

export function FarcasterConnectWithProvider({
  isFarcasterRequired,
  connectedFarcasterAccount
}: {
  isFarcasterRequired: boolean;
  connectedFarcasterAccount?: LoggedInUser['farcasterUser'];
}) {
  return (
    <AuthKitProvider
      config={{
        ...warpcastConfig,
        provider: undefined
      }}
    >
      <FarcasterConnect
        isFarcasterRequired={isFarcasterRequired}
        connectedFarcasterAccount={connectedFarcasterAccount}
      />
    </AuthKitProvider>
  );
}
