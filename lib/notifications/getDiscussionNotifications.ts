import { getDiscussionTasks } from 'lib/discussion/getDiscussionTasks';

import { getCardNotifications } from './getCardNotifications';
import { getDocumentNotifications } from './getDocumentNotifications';
import type { DiscussionNotification, NotificationsGroup } from './interfaces';
import { sortByDate, upgradedNotificationUserIds } from './utils';

export async function getDiscussionNotifications(userId: string): Promise<NotificationsGroup<DiscussionNotification>> {
  if (upgradedNotificationUserIds.includes(userId)) {
    const cardNotifications = await getCardNotifications(userId);
    const documentNotifications = await getDocumentNotifications(userId);

    return {
      marked: [...cardNotifications.marked, ...documentNotifications.marked].sort(sortByDate),
      unmarked: [...cardNotifications.unmarked, ...documentNotifications.unmarked].sort(sortByDate)
    };
  }

  return getDiscussionTasks(userId);
}
