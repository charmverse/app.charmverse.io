import { useState } from 'react';

import type { NotificationDetails } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';

type NotificationDisplayType = 'all' | 'bounty' | 'vote' | 'mention' | 'proposal' | 'forum';

export function useNotificationModal({
  marked,
  unmarked
}: {
  marked: NotificationDetails[];
  unmarked: NotificationDetails[];
}) {
  const [notificationsDisplayType, setNotificationsDisplayType] = useState<NotificationDisplayType>('all');

  function filterNotifications(notifications: NotificationDetails[]) {
    if (notificationsDisplayType === 'all') {
      return notifications;
    } else {
      return notifications.filter((n) => n.type === notificationsDisplayType);
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

  return {
    notificationsDisplayType,
    setNotificationsDisplayType,
    hasUnreadNotifications,
    markedNotifications,
    unmarkedNotifications
  };
}
