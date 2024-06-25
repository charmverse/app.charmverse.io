'use client';

import { useFarcasterConnection } from '@connect/hooks/useFarcasterConnection';
import { AuthKitProvider, type AuthClientError } from '@farcaster/auth-kit';
import Button from '@mui/material/Button';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { warpcastConfig } from 'lib/farcaster/config';

import { FarcasterLoginModal } from './components/WarpcastModal';

function WarpcastLoginButton({ onSuccess }: { onSuccess: () => void }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'warpcast-login' });

  const onSuccessCallback = useCallback(async () => {
    popupState.close();
    onSuccess();
  }, [onSuccess, popupState.close]);

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    popupState.close();
  }, []);

  const onClick = useCallback(() => {
    popupState.open();
  }, []);

  const { signIn, url } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick
  });

  return (
    <>
      <Button size='small' onClick={signIn}>
        Connect with Farcaster
      </Button>
      <FarcasterLoginModal open={popupState.isOpen} onClose={popupState.close} url={url} />
    </>
  );
}

export function WarpcastLogin() {
  const router = useRouter();

  return (
    <AuthKitProvider config={warpcastConfig}>
      <WarpcastLoginButton
        onSuccess={() => {
          router.push('/welcome');
        }}
      />
    </AuthKitProvider>
  );
}
