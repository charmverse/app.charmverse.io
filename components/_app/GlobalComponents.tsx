import { useEffect } from 'react';
import { mutate } from 'swr';

import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { UserProfileDialogGlobal } from 'components/common/UserProfile/UserProfileDialogGlobal';
import { useImportDiscordRoles } from 'components/settings/roles/hooks/useImportDiscordRoles';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getPagesListCacheKey, usePages } from 'hooks/usePages';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

import useDatadogLogger from './hooks/useDatadogLogger';

export function GlobalComponents() {
  const dispatch = useAppDispatch();
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();
  const { setPages } = usePages();
  // Register logs to Datadog
  useDatadogLogger();

  // Trigger discord role import on redirect since modal won't be open
  useImportDiscordRoles();

  const handlePagesRestoredEvent = async (payload: WebSocketPayload<'pages_restored'>) => {
    // Refetch pages after restoration
    if (currentSpace) {
      await mutate(getPagesListCacheKey(currentSpace.id));
      dispatch(initialLoad({ spaceId: currentSpace.id }));
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

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <UserProfileDialogGlobal />
      <Snackbar />
    </>
  );
}
