import useSWR from 'swr';
import charmClient from 'charmClient';

export default function useTasks () {

  const { data: tasks, error: serverError, mutate } = useSWR('/tasks/list', () => charmClient.getTasks());
  const error = serverError?.message || serverError;
  const isLoading = !tasks;

  return { tasks, mutate, error, isLoading };
}
