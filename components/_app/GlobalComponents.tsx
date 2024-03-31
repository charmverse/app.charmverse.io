import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { mutate } from 'swr';

import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import { VerifyLoginOtpModal } from 'components/login/components/VerifyLoginOtpModal';
import { MemberProfileDialogGlobal } from 'components/members/components/MemberProfileDialogGlobal';
import { useAppLoadedEvent } from 'hooks/useAppLoadedEvent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMarkNotificationFromUrl } from 'hooks/useMarkNotificationFromUrl';
import { getPagesListCacheKey } from 'hooks/usePages';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useVerifyLoginOtp } from 'hooks/useVerifyLoginOtp';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { ConfirmationModal } from './components/ConfirmationModal';
import { Snackbar } from './components/Snackbar';
import { UserOnboardingDialogGlobal } from './components/UserOnboardingDialog';
import useDatadogLogger from './hooks/useDatadogLogger';

export function GlobalComponents() {
  const router = useRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { openSettings, isOpen: isSettingsDialogOpen } = useSettingsDialog();
  const { isOpen: isVerifyOtpOpen, close: closeVerifyOtp } = useVerifyLoginOtp();
  // Register logs to Datadog
  useDatadogLogger();

  useAppLoadedEvent();

  useMarkNotificationFromUrl();

  const handlePagesRestoredEvent = async (payload: WebSocketPayload<'pages_restored'>) => {
    // Refetch pages after restoration
    if (currentSpace) {
      await mutate(getPagesListCacheKey(currentSpace.id));
      mutate(`archived-pages-${currentSpace.id}`);
    }
  };

  // Moving it inside usePages doesn't work since <DatabaseProvider> is located aboev
  useEffect(() => {
    const unsubscribeRestoreListener = subscribe('pages_restored', handlePagesRestoredEvent);
    return () => {
      unsubscribeRestoreListener();
    };
  }, [currentSpace?.id]);

  useEffect(() => {
    const account = router.query.account;
    const subscription = router.query.subscription;

    if (!isSettingsDialogOpen && router.isReady) {
      if (account) {
        openSettings('account');
      }
      if (subscription) {
        openSettings('subscription');
      }
    }
  }, [isSettingsDialogOpen, router.isReady, openSettings, router.query.account, router.query.subscription]);

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <MemberProfileDialogGlobal />
      <UserOnboardingDialogGlobal />
      <ConfirmationModal />
      <VerifyLoginOtpModal open={isVerifyOtpOpen} onClose={closeVerifyOtp} />
      <Snackbar />
    </>
  );
}
