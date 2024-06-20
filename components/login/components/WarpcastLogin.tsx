import { AuthKitProvider } from '@farcaster/auth-kit';

import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import PrimaryButton from 'components/common/PrimaryButton';
import { warpcastConfig } from 'lib/farcaster/config';
import type { LoginType } from 'lib/farcaster/interfaces';

import { useWarpcastLogin } from '../hooks/useWarpcastLogin';

import { FarcasterLoginModal } from './FarcasterModal';

function WarpcastLoginButton({ type }: { type: LoginType }) {
  const { close, isLoading, isOpen, signIn, url } = useWarpcastLogin({ type });

  return (
    <>
      {type === 'login' ? (
        <ConnectorButton
          onClick={signIn}
          data-test='connect-warpcast-button'
          name='Connect with Warpcast'
          disabled={isLoading}
          isActive={false}
          isLoading={false}
          icon={<img src='/images/logos/warpcast.png' style={{ width: '30px', height: '30px', marginLeft: '3px' }} />}
        />
      ) : (
        <PrimaryButton disabled={isLoading} loading={isLoading} size='small' onClick={signIn}>
          Connect
        </PrimaryButton>
      )}
      <FarcasterLoginModal open={isOpen} onClose={close} url={url} />
    </>
  );
}

export function WarpcastLogin({ type }: { type: LoginType }) {
  return (
    <AuthKitProvider config={warpcastConfig}>
      <WarpcastLoginButton type={type} />
    </AuthKitProvider>
  );
}
