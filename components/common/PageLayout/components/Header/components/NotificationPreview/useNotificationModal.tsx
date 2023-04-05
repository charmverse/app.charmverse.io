import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import type { NotificationDetails } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';
import useTasks from 'components/nexus/hooks/useTasks';

type NotificationDisplayType = 'all' | 'bounty' | 'vote' | 'mention' | 'proposal' | 'forum';

export function useNotificationModal({
  marked,
  unmarked
}: {
  marked: NotificationDetails[];
  unmarked: NotificationDetails[];
}) {
  const { mutate: mutateTasks } = useTasks();
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

  const markBulkAsRead = useCallback(async () => {
    const groupType = notificationsDisplayType === 'all' ? undefined : unmarkedNotifications[0]?.groupType;
    const tasksToMark = unmarkedNotifications.map((n) => ({ id: n.taskId, type: n.type }));
    await charmClient.tasks.markTasks(tasksToMark);

    mutateTasks(
      (_tasks) => {
        if (!_tasks) {
          return;
        }

        if (notificationsDisplayType === 'all') {
          return {
            votes: { marked: [..._tasks.votes.unmarked, ..._tasks.votes.marked], unmarked: [] },
            discussions: { marked: [..._tasks.discussions.unmarked, ..._tasks.discussions.marked], unmarked: [] },
            proposals: { marked: [..._tasks.proposals.unmarked, ..._tasks.proposals.marked], unmarked: [] },
            bounties: { marked: [..._tasks.bounties.unmarked, ..._tasks.bounties.marked], unmarked: [] },
            forum: { marked: [..._tasks.forum.unmarked, ..._tasks.forum.marked], unmarked: [] }
          };
        }

        if (groupType) {
          return {
            ..._tasks,
            [groupType]: {
              marked: [..._tasks[groupType].unmarked, ..._tasks[groupType].marked],
              unmarked: []
            }
          };
        }

        return _tasks;
      },
      {
        revalidate: false
      }
    );
  }, [mutateTasks, notificationsDisplayType, unmarkedNotifications]);

  return {
    notificationsDisplayType,
    setNotificationsDisplayType,
    hasUnreadNotifications,
    markedNotifications,
    unmarkedNotifications,
    markBulkAsRead
  };
}
