import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

function useSpaceNotificationsData() {
  const { user } = useUser();
  const { currentSpaceId } = useCurrentSpaceId();
  const { data, error, isLoading, mutate } = useSWRImmutable(
    user && currentSpaceId ? `/api/profile/space-notifications/${user.id}/${currentSpaceId}` : null,
    () => {
      return charmClient.profile.getSpaceNotifications({ spaceId: currentSpaceId });
    }
  );
  return { spaceId: currentSpaceId, settings: data, error, refresh: mutate, isLoading };
}

export function useForumCategoryNotification(categoryId: string) {
  const { settings, spaceId, refresh } = useSpaceNotificationsData();
  const { showMessage } = useSnackbar();

  return useMemo(() => {
    const enabled = settings?.forums.categories?.[categoryId] ?? false;
    return {
      enabled,
      isLoading: !settings,
      async toggle() {
        await charmClient.profile.setForumCategoryNotification({
          spaceId,
          categoryId,
          enabled: !enabled
        });
        const message = enabled
          ? 'Unfollowed. You won’t get updates on new activity anymore.'
          : 'Success! You will see notifications from this category in the future.';
        showMessage(message, 'success');
        refresh();
      }
    };
  }, [categoryId, spaceId, refresh, settings]);
}
