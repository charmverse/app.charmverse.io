
import useSWR from 'swr';
import charmClient from 'charmClient';

export default function useTasks () {

  const { data: tasks, error: serverError } = useSWR('/tasks', () => charmClient.getTasks());
  const error = serverError?.message || serverError;

  return { tasks, error };
}
