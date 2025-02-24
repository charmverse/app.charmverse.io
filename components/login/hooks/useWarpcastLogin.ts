import type { AuthClientError } from '@farcaster/auth-kit';
import type { LoggedInUser } from '@packages/profile/getUser';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback } from 'react';

import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { useSnackbar } from 'hooks/useSnackbar';
import type { LoginType } from 'lib/farcaster/interfaces';

export function useWarpcastLogin({ type }: { type: LoginType }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'warpcast-login' });
  const { showMessage } = useSnackbar();

  const onSuccessCallback = useCallback(async (res: LoggedInUser | { otpRequired: true }) => {
    popupState.close();

    if ('id' in res) {
      if (type === 'login') {
        window.location.reload();
        showMessage(`Logged in with Warpcast. Redirecting you now`, 'success');
      } else {
        showMessage(`Connected to Warpcast.`, 'success');
      }
    }
  }, []);

  const onErrorCallback = useCallback((err?: AuthClientError) => {
    popupState.close();
    showMessage(err?.message || 'Error connecting to Warpcast. Please try again.', 'error');
  }, []);

  const onClick = useCallback(() => {
    popupState.open();
  }, []);

  const { signIn, isLoading, url, connect } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick,
    type
  });

  return {
    isOpen: popupState.isOpen,
    close: popupState.close,
    isLoading,
    signIn,
    url,
    connect
  };
}
