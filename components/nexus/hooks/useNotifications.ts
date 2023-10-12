import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export function useNotifications() {
  const { user } = useUser();
  const {
    data: notifications,
    error: serverError,
    isLoading,
    mutate
  } = useSWRImmutable(
    user ? `/notifications/list/${user.id}` : null,
    () => charmClient.notifications.getNotifications(),
    {
      // 10 minutes
      refreshInterval: 1000 * 10 * 60
    }
  );

  const error = serverError?.message || serverError;

  return { notifications, mutate, error, isLoading };
}
