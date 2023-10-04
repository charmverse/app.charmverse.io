import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export function useTasks() {
  const { user } = useUser();
  const {
    data: tasks,
    error: serverError,
    isLoading,
    mutate
  } = useSWRImmutable(user ? `/notifications/list/${user.id}` : null, () => charmClient.notifications.getTasksList(), {
    // 10 minutes
    refreshInterval: 1000 * 10 * 60
  });

  const error = serverError?.message || serverError;

  return { tasks, mutate, error, isLoading };
}
