'use client';

import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { useSignIn } from '@farcaster/auth-kit';
import { useCallback, useEffect } from 'react';

export function useFarcasterConnection({
  onError,
  onSuccess,
  onClick
}: {
  onSuccess?: () => Promise<void>;
  onError?: (error: any) => void;
  onClick?: () => void;
}) {
  const onSuccessCallback = useCallback(
    async (res: StatusAPIResponse) => {
      // on success handler
    },
    [onSuccess, onError]
  );

  const signInProps = useSignIn({
    onError,
    onSuccess: onSuccessCallback
  });

  const { signIn, connect, reconnect, isError, channelToken } = signInProps;

  const onSignInClick = useCallback(() => {
    if (isError) {
      reconnect();
    }
    onClick?.();
    signIn();
  }, [isError, reconnect, signIn, onClick]);

  useEffect(() => {
    if (!channelToken) {
      connect();
    }
  }, [channelToken, connect]);

  return { ...signInProps, signIn: onSignInClick };
}
