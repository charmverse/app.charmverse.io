import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

function useSpaceNotificationsData() {
  const { user } = useUser();
  const { space: currentSpace } = useCurrentSpace();
  const { data, error, isLoading, mutate } = useSWRImmutable(
    user && currentSpace ? `/api/profile/space-notifications/${user.id}/${currentSpace.id}` : null,
    () => {
      return charmClient.profile.getSpaceNotifications({ spaceId: currentSpace?.id || '' });
    }
  );

  return { spaceId: currentSpace?.id || '', settings: data, error, refresh: mutate, isLoading };
}

export function useForumCategoryNotification(categoryId: string) {
  const { settings, spaceId, refresh } = useSpaceNotificationsData();
  const { showMessage } = useSnackbar();
  const enabled = settings?.forums.categories?.[categoryId] ?? false;
  const isLoading = !settings;

  return useMemo(() => {
    return {
      enabled,
      isLoading,
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
  }, [categoryId, enabled, spaceId, refresh, isLoading]);
}
