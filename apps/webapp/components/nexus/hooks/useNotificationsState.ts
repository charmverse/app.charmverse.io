import { DateTime } from 'luxon';
import useSWR from 'swr';

import charmClient from 'charmClient';

export default function useNotificationsState() {
  const {
    data,
    error: serverError,
    mutate
  } = useSWR('/notifications/state', () => charmClient.notifications.getNotificationsState());
  const error = serverError?.message || serverError;

  const snoozedForDate = data?.snoozedFor ? DateTime.fromJSDate(new Date(data.snoozedFor)) : null;

  return { snoozedForDate, snoozedMessage: data?.snoozedMessage || null, mutate, isLoading: !data, error };
}
