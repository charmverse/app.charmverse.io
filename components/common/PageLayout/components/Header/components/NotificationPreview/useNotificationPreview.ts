import { NotificationType } from '@prisma/client';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
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
  const { tasks, mutate: mutateTasks } = useTasks();

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
    spaceDomain: n.spaceDomain,
    groupType: type,
    path: getNotificationPreviewPath(n),
    title: getNotificationPreviewTitle(n),
    type: getNotificationPreviewType(type),
    commentId: getNotificationPreviewCommentId(n),
    mentionId: getNotificationPreviewMentionId(n),
    bountyId: getNotificationPreviewBountyId(n),
    action: getNotificationPreviewAction(n)
  }));
}

function getNotificationPreviewPath(notification: NotificationPreview) {
  if ('pagePath' in notification) {
    return notification.pagePath;
  }

  if ('postPath' in notification) {
    return notification.postPath;
  }

  return null;
}

function getNotificationPreviewBountyId(notification: NotificationPreview) {
  if ('bountyId' in notification) {
    return notification.bountyId;
  }

  return null;
}

function getNotificationPreviewAction(notification: NotificationPreview) {
  if ('action' in notification) {
    return notification.action;
  }

  return null;
}

function getNotificationPreviewMentionId(notification: NotificationPreview) {
  if ('mentionId' in notification) {
    return notification.mentionId;
  }

  return null;
}

function getNotificationPreviewCommentId(notification: NotificationPreview) {
  if ('commentId' in notification) {
    return notification.commentId;
  }

  return null;
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

function getNotificationPreviewType(groupType: NotificationGroupType): NotificationType {
  if (groupType === 'discussions') {
    return NotificationType.mention;
  }
  if (groupType === 'forum') {
    return NotificationType.forum;
  }
  if (groupType === 'proposals') {
    return NotificationType.proposal;
  }
  if (groupType === 'bounties') {
    return NotificationType.bounty;
  }
  if (groupType === 'votes') {
    return NotificationType.vote;
  }
  return NotificationType.forum;
}
