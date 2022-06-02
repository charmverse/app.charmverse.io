
import useSWR from 'swr';
import { DateTime } from 'luxon';
import charmClient from 'charmClient';

export default function useTasks () {

  const { data: tasks, error: serverError, mutate } = useSWR('/tasks', () => charmClient.getTasks());
  const error = serverError?.message || serverError;

  const snoozedForDate = tasks?.snoozedFor ? DateTime.fromJSDate(new Date(tasks.snoozedFor)) : null;

  const isLoading = !tasks;

  return { tasks, snoozedForDate, snoozedMessage: tasks?.snoozedMessage || null, mutate, error, isLoading };
}
