import { useEffect } from 'react';
import { mutate } from 'swr';

import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { UserProfileDialogGlobal } from 'components/common/UserProfile/UserProfileDialogGlobal';
import { useImportDiscordRoles } from 'components/settings/roles/hooks/useImportDiscordRoles';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

import useDatadogLogger from './hooks/useDatadogLogger';

export function GlobalComponents() {
  const dispatch = useAppDispatch();
  const { space: currentSpace } = useCurrentSpace();
  const { subscribe } = useWebSocketClient();

  // Register logs to Datadog
  useDatadogLogger();

  // Trigger discord role import on redirect since modal won't be open
  useImportDiscordRoles();

  const handlePagesRestoredEvent = () => {
    // Refetch pages after restoration
    if (currentSpace) {
      mutate(`pages/${currentSpace.id}`);
      dispatch(initialLoad({ spaceId: currentSpace.id }));
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
