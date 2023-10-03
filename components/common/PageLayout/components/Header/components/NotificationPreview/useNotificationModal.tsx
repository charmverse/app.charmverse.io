import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useNotifications, type NotificationDetails, type NotificationDisplayType } from 'hooks/useNotifications';

export function useNotificationModal({
  marked,
  unmarked,
  notificationDisplayType
}: {
  marked: NotificationDetails[];
  unmarked: NotificationDetails[];
  notificationDisplayType: NotificationDisplayType | null;
}) {
  const { mutateNotifications } = useNotifications();
  function filterNotifications(notifications: NotificationDetails[]) {
    if (notificationDisplayType === 'all') {
      return notifications;
    } else {
      return notifications.filter((n) => n.type === notificationDisplayType);
    }
  }

  const hasUnreadNotifications: Record<NotificationDisplayType, boolean> = {
    vote: !!unmarked.find((n) => n.type === 'vote'),
    mention: !!unmarked.find((n) => n.type === 'mention'),
    proposal: !!unmarked.find((n) => n.type === 'proposal'),
    bounty: !!unmarked.find((n) => n.type === 'bounty'),
    forum: !!unmarked.find((n) => n.type === 'forum'),
    all: !!unmarked.length
  };

  const markedNotifications = filterNotifications(marked);
  const unmarkedNotifications = filterNotifications(unmarked);

  const markBulkAsRead = useCallback(async () => {
    const groupType = notificationDisplayType === 'all' ? undefined : unmarkedNotifications[0]?.groupType;
    const notificationsToMark = unmarkedNotifications.map((n) => ({ id: n.id, type: n.type }));
    await charmClient.notifications.markNotifications(notificationsToMark);

    mutateNotifications(
      (_notifications) => {
        if (!_notifications) {
          return;
        }

        if (notificationDisplayType === 'all') {
          return {
            votes: { marked: [..._notifications.votes.unmarked, ..._notifications.votes.marked], unmarked: [] },
            discussions: {
              marked: [..._notifications.discussions.unmarked, ..._notifications.discussions.marked],
              unmarked: []
            },
            proposals: {
              marked: [..._notifications.proposals.unmarked, ..._notifications.proposals.marked],
              unmarked: []
            },
            bounties: {
              marked: [..._notifications.bounties.unmarked, ..._notifications.bounties.marked],
              unmarked: []
            },
            forum: { marked: [..._notifications.forum.unmarked, ..._notifications.forum.marked], unmarked: [] }
          };
        }

        if (groupType) {
          return {
            ..._notifications,
            [groupType]: {
              marked: [..._notifications[groupType].unmarked, ..._notifications[groupType].marked],
              unmarked: []
            }
          };
        }

        return _notifications;
      },
      {
        revalidate: false
      }
    );
  }, [mutateNotifications, notificationDisplayType, unmarkedNotifications]);

  return {
    hasUnreadNotifications,
    markedNotifications,
    unmarkedNotifications,
    markBulkAsRead
  };
}
