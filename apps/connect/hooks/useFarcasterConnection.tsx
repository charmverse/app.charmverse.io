'use client';

import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { useSignIn } from '@farcaster/auth-kit';
import { ConnectApiClient } from 'apiClient/apiClient';
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
  const onWarpcastSuccessCallback = useCallback(
    async (res: StatusAPIResponse) => {
      const connectApiClient = new ConnectApiClient();
      await connectApiClient.loginViaFarcaster(res);
      onSuccess?.();
    },
    [onSuccess]
  );

  const signInProps = useSignIn({
    onError,
    onSuccess: onWarpcastSuccessCallback
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
