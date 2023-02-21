import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
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
  return { settings: data, error, refresh: mutate, isLoading };
}

export function useForumCategoryNotification(categoryId: string) {
  const { settings, refresh } = useSpaceNotificationsData();
  const { currentSpaceId } = useCurrentSpaceId();

  return useMemo(() => {
    const enabled = settings?.forums.categories?.[categoryId] ?? false;
    return {
      enabled,
      isLoading: !settings,
      async toggle() {
        await charmClient.profile.setForumCategoryNotification({
          spaceId: currentSpaceId,
          categoryId,
          enabled: !enabled
        });
        refresh();
      }
    };
  }, [categoryId, currentSpaceId, refresh, settings]);
}
