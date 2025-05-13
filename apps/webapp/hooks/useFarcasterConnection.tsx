import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { useSignIn } from '@farcaster/auth-kit';
import type { LoggedInUser } from '@packages/profile/getUser';
import { useCallback, useEffect } from 'react';

import { useFarcasterConnect, useFarcasterLogin } from 'charmClient/hooks/farcaster';
import type { LoginType } from '@packages/lib/farcaster/interfaces';

import { useUser } from './useUser';
import { useVerifyLoginOtp } from './useVerifyLoginOtp';

export function useFarcasterConnection({
  onError,
  onSuccess,
  onClick,
  type = 'connect'
}: {
  onSuccess?: (user: LoggedInUser | { otpRequired: true }) => Promise<void>;
  onError?: (error: any) => void;
  onClick?: () => void;
  type?: LoginType;
}) {
  const { open: openVerifyOtpModal } = useVerifyLoginOtp();
  const { updateUser } = useUser();
  const { trigger: login, isMutating: isLoginLoading } = useFarcasterLogin();
  const { trigger: connectFarcaster, isMutating: isConnectLoading } = useFarcasterConnect();

  const onSuccessCallback = useCallback(
    async (res: StatusAPIResponse) => {
      if (type === 'login') {
        await login(res, {
          onSuccess: (_res) => {
            if ('id' in _res) {
              updateUser(_res);
            } else {
              openVerifyOtpModal();
            }
            onSuccess?.(_res);
          },
          onError: (err) => {
            onError?.(err);
          }
        });
      }

      if (type === 'connect') {
        await connectFarcaster(res, {
          onSuccess: (_res) => {
            updateUser(_res);
            onSuccess?.(_res);
          },
          onError: (err) => {
            onError?.(err);
          }
        });
      }
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

  return { ...signInProps, signIn: onSignInClick, isLoading: isLoginLoading || isConnectLoading };
}
