import type { AuthClientError } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback } from 'react';

import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import PrimaryButton from 'components/common/PrimaryButton';
import { useFarcasterConnection } from 'hooks/useFarcasterConnection';
import { useSnackbar } from 'hooks/useSnackbar';
import type { LoginType } from 'lib/farcaster/interfaces';
import type { LoggedInUser } from 'models';

import { FarcasterLoginModal } from './FarcasterModal';

export function WarpcastLogin({ type }: { type: LoginType }) {
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

  const { signIn, isLoading, url } = useFarcasterConnection({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onClick,
    type
  });

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
      <FarcasterLoginModal open={popupState.isOpen} onClose={popupState.close} url={url} />
    </>
  );
}
