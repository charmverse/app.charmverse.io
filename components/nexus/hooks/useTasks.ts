import useSWRImmutable from 'swr/immutable';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export default function useTasks () {
  const [user] = useUser();
  const { data: tasks, error: serverError, mutate } = useSWRImmutable(user ? `/tasks/list/${user.id}` : null, () => charmClient.getTasks(), {
    // 10 minutes
    refreshInterval: 1000 * 10 * 60
  });
  const error = serverError?.message || serverError;
  const isLoading = !tasks;

  return { tasks, mutate, error, isLoading };
}
