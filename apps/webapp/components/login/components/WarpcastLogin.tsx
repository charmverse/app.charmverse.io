import { AuthKitProvider } from '@farcaster/auth-kit';
import { warpcastConfig } from '@packages/lib/farcaster/config';
import type { LoginType } from '@packages/lib/farcaster/interfaces';

import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import { Button } from 'components/common/Button';

import { useWarpcastLogin } from '../hooks/useWarpcastLogin';

import { FarcasterLoginModal } from './FarcasterModal';

function WarpcastLoginButton({
  size = 'medium',
  type,
  label = 'Connect'
}: {
  size?: string;
  type: LoginType;
  label?: string;
}) {
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
          icon={<img src='/images/logos/warpcast.png' style={{ width: '24px', height: '24px', marginLeft: '3px' }} />}
        />
      ) : (
        <Button size={size} color='primary' disabled={isLoading} loading={isLoading} onClick={signIn}>
          {label}
        </Button>
      )}
      <FarcasterLoginModal open={isOpen} onClose={close} url={url} />
    </>
  );
}

export function WarpcastLogin({ size, type, label }: { size?: string; type: LoginType; label?: string }) {
  return (
    <AuthKitProvider
      config={{
        ...warpcastConfig,
        provider: undefined
      }}
    >
      <WarpcastLoginButton size={size} type={type} label={label} />
    </AuthKitProvider>
  );
}
