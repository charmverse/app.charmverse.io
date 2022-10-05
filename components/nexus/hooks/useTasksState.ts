
import { DateTime } from 'luxon';
import useSWR from 'swr';

import charmClient from 'charmClient';

export default function useTasks () {

  const { data, error: serverError, mutate } = useSWR('/tasks/state', () => charmClient.tasks.getTasksState());
  const error = serverError?.message || serverError;

  const snoozedForDate = data?.snoozedFor ? DateTime.fromJSDate(new Date(data.snoozedFor)) : null;

  return { snoozedForDate, snoozedMessage: data?.snoozedMessage || null, mutate, isLoading: !data, error };
}
