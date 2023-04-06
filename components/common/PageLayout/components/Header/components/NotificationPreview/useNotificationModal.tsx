import { useCallback } from 'react';

import charmClient from 'charmClient';
import type {
  NotificationDetails,
  NotificationDisplayType
} from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotifications';
import { useTasks } from 'components/nexus/hooks/useTasks';

export function useNotificationModal({
  marked,
  unmarked,
  notificationDisplayType
}: {
  marked: NotificationDetails[];
  unmarked: NotificationDetails[];
  notificationDisplayType: NotificationDisplayType | null;
}) {
  const { mutate: mutateTasks } = useTasks();
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
    const tasksToMark = unmarkedNotifications.map((n) => ({ id: n.taskId, type: n.type }));
    await charmClient.tasks.markTasks(tasksToMark);

    mutateTasks(
      (_tasks) => {
        if (!_tasks) {
          return;
        }

        if (notificationDisplayType === 'all') {
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
  }, [mutateTasks, notificationDisplayType, unmarkedNotifications]);

  return {
    hasUnreadNotifications,
    markedNotifications,
    unmarkedNotifications,
    markBulkAsRead
  };
}
