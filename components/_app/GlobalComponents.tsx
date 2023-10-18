import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { mutate } from 'swr';

import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberProfileDialogGlobal } from 'components/members/components/MemberProfileDialogGlobal';
import { ApplicationDialog } from 'components/rewards/components/RewardApplicationDialog';
import { useImportDiscordRoles } from 'components/settings/roles/hooks/useImportDiscordRoles';
import { useAppLoadedEvent } from 'hooks/useAppLoadedEvent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getPagesListCacheKey, usePages } from 'hooks/usePages';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import { UserOnboardingDialogGlobal } from './components/UserOnboardingDialog';
import useDatadogLogger from './hooks/useDatadogLogger';

export function GlobalComponents() {
  const router = useRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { setPages } = usePages();
  const { openSettings, isOpen: isSettingsDialogOpen } = useSettingsDialog();
  // Register logs to Datadog
  useDatadogLogger();

  useAppLoadedEvent();

  // Trigger discord role import on redirect since modal won't be open
  useImportDiscordRoles();

  const handlePagesRestoredEvent = async (payload: WebSocketPayload<'pages_restored'>) => {
    // Refetch pages after restoration
    if (currentSpace) {
      await mutate(getPagesListCacheKey(currentSpace.id));
      mutate(`archived-pages-${currentSpace.id}`);
      // This is required to make the delete page banner go away
      setPages((_pages) => {
        if (_pages) {
          payload.forEach(({ id: pageId }) => {
            const page = _pages[pageId];
            if (page) {
              page.deletedAt = null;
            }
          });
        }

        return _pages;
      });
    }
  };

  // Moving it inside usePages doesn't work since <FocalboardProvider> is located aboev
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
      <ApplicationDialog />
      <Snackbar />
    </>
  );
}
