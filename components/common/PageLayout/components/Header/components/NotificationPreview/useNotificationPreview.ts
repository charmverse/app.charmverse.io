import { NotificationType } from '@prisma/client';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import { BountyTaskAction } from 'lib/bounties/getBountyTasks';
import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import type { ForumTask } from 'lib/forums/getForumNotifications/getForumNotifications';
import type { NotificationGroupType } from 'lib/notifications/interfaces';
import type { ProposalTask } from 'lib/proposal/getProposalTasks';
import type { VoteTask } from 'lib/votes/interfaces';

type NotificationPreview = VoteTask | ProposalTask | BountyTask | DiscussionTask | ForumTask;

type MarkAsReadParams = { taskId: string; groupType: NotificationGroupType; type: NotificationType };
export type MarkNotificationAsRead = (params: MarkAsReadParams) => Promise<void>;

export function useNotificationPreview() {
  const { tasks, gnosisTasks, mutate: mutateTasks } = useTasks();

  // @TODOM - verify data, add proper titles, add gnosis notifications
  const notificationPreviews = useMemo(() => {
    if (!tasks) return [];

    return [
      ...getNotificationPreviewItems(tasks.votes.unmarked, 'votes'),
      ...getNotificationPreviewItems(tasks.proposals.unmarked, 'proposals'),
      ...getNotificationPreviewItems(tasks.bounties.unmarked, 'bounties'),
      ...getNotificationPreviewItems(tasks.discussions.unmarked, 'discussions'),
      ...getNotificationPreviewItems(tasks.forum.unmarked, 'forum')
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);
  const markAsRead: MarkNotificationAsRead = useCallback(
    async ({
      taskId,
      type,
      groupType
    }: {
      taskId: string;
      groupType: NotificationGroupType;
      type: NotificationType;
    }) => {
      await charmClient.tasks.markTasks([{ id: taskId, type }]);

      mutateTasks(
        (_tasks) => {
          if (!_tasks) {
            return;
          }

          const taskIndex = _tasks?.[groupType].unmarked.findIndex((t) => t.taskId === taskId);
          if (typeof taskIndex === 'number' && taskIndex > -1) {
            const marked = [_tasks?.[groupType].unmarked[taskIndex], ..._tasks.forum.marked];
            const unmarkedItems = _tasks[groupType].unmarked;
            const unmarked = [...unmarkedItems.slice(0, taskIndex), ...unmarkedItems.slice(taskIndex + 1)];

            return {
              ..._tasks,
              [groupType]: {
                marked,
                unmarked
              }
            };
          }

          return _tasks;
        },
        {
          revalidate: false
        }
      );
    },
    []
  );

  return { notificationPreviews, markAsRead };
}

function getNotificationPreviewItems(notifications: NotificationPreview[], type: NotificationGroupType) {
  return notifications.map((n) => ({
    id: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    // spaceDomain: n.spaceDomain,
    groupType: type,
    title: getNotificationPreviewTitle(n),
    type: getNotificationPreviewType(n)
  }));
}

function getNotificationPreviewTitle(notification: NotificationPreview) {
  if ('postTitle' in notification) {
    return notification.postTitle;
  }

  if ('pageTitle' in notification) {
    return notification.pageTitle;
  }

  if ('title' in notification) {
    return notification.title;
  }

  return '';
}

function getNotificationPreviewType(notification: NotificationPreview): NotificationType {
  // @TODOM - map types
  if ('text' in notification) {
    return NotificationType.mention;
  }
  if ('postPath' in notification) {
    return NotificationType.forum;
  }
  if ('voteOptions' in notification) {
    return NotificationType.vote;
  }
  return NotificationType.forum;
}
