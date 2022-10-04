import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export default function useTasks () {
  const { user } = useUser();
  const { data: tasks, error: serverError, mutate } = useSWRImmutable(user ? `/tasks/list/${user.id}` : null, () => charmClient.tasks.getTasksList(), {
    // 10 minutes
    refreshInterval: 1000 * 10 * 60
  });

  const { data: gnosisTasks, error: gnosisTasksServerError, mutate: mutateGnosisTasks } = useSWRImmutable(user ? `/tasks/gnosis/${user.id}` : null, () => charmClient.tasks.getGnosisTasks(), {
    // 10 minutes
    refreshInterval: 1000 * 10 * 60
  });

  const error = serverError?.message || serverError;
  const isLoading = !tasks;

  return { tasks, gnosisTasks, gnosisTasksServerError, mutateGnosisTasks, mutate, error, isLoading };
}
