import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useNotifications() {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const {
    data: notifications = [],
    error: serverError,
    isLoading,
    mutate
  } = useSWR(user ? `/notifications/list/${user.id}` : null, () => charmClient.notifications.getNotifications(), {
    // 10 minutes
    refreshInterval: 1000 * 10 * 60
  });

  const error = serverError?.message || serverError;

  const currentSpaceNotifications = useMemo(() => {
    return space ? notifications.filter((notification) => notification.spaceId === space.id) : [];
  }, [notifications, space]);

  const currentSpaceUnreadNotifications = useMemo(() => {
    return currentSpaceNotifications.filter((notification) => !notification.read);
  }, [currentSpaceNotifications]);

  const otherSpacesUnreadNotifications = useMemo(() => {
    return space ? notifications.filter((notification) => !notification.read && notification.spaceId !== space.id) : [];
  }, [notifications, space]);

  return {
    notifications,
    unreadNotifications: notifications.filter((notification) => !notification.read),
    mutate,
    error,
    isLoading,
    currentSpaceNotifications,
    currentSpaceUnreadNotifications,
    otherSpacesUnreadNotifications
  };
}
