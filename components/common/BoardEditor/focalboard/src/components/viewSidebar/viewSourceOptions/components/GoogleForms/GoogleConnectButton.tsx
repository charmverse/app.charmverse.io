/// <reference types="google.accounts" />

import Script from 'next/script';

import { Button } from 'components/common/Button';

import { googleIdentityServiceScript, useGoogleAuth } from './hooks/useGoogleAuth';

export function GoogleConnectButton({ onConnect }: { onConnect?: () => void }) {
  const { loginWithGoogle, onLoadScript } = useGoogleAuth({ onConnect });
  return (
    <>
      <Script src={googleIdentityServiceScript} onReady={onLoadScript} />
      <Button onClick={loginWithGoogle} variant='outlined'>
        Connect Google Account
      </Button>
    </>
  );
}
