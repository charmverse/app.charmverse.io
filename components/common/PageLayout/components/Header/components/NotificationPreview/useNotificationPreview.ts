import { NotificationType } from '@prisma/client';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { DiscussionTask, TaskUser } from 'lib/discussion/interfaces';
import type { ForumTask } from 'lib/forums/getForumNotifications/getForumNotifications';
import type { NotificationGroupType } from 'lib/notifications/interfaces';
import type { NotificationActor } from 'lib/notifications/mapNotificationActor';
import type { ProposalTask } from 'lib/proposal/getProposalTasks';
import type { VoteTask } from 'lib/votes/interfaces';

type NotificationPreview = VoteTask | ProposalTask | BountyTask | DiscussionTask | ForumTask;
type MarkAsReadParams = { taskId: string; groupType: NotificationGroupType; type: NotificationType };
export type MarkNotificationAsRead = (params: MarkAsReadParams) => Promise<void>;

export type NotificationDetails = {
  spaceName: string;
  createdAt: string | Date;
  createdBy: NotificationActor | TaskUser | null;
  groupType: NotificationGroupType;
  type: NotificationType;
  taskId: string;
  content: string;
  href: string;
  title: string;
};

export function useNotificationPreview() {
  const { tasks, mutate: mutateTasks } = useTasks();

  const notificationPreviews: NotificationDetails[] = useMemo(() => {
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

function getNotificationPreviewItems(notifications: NotificationPreview[], groupType: NotificationGroupType) {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType,
    type: getNotificationPreviewType(groupType),
    href: getNotificationHref(n, groupType),
    content: getNotificationContent(n, groupType),
    title: getNotificationTitle(groupType)
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

function getNotificationConentTitle(notification: NotificationPreview) {
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

function getNotificationHref(n: NotificationPreview, groupType: NotificationGroupType) {
  const { spaceDomain, taskId } = n;
  const path = getNotificationPreviewPath(n);
  const commentId = 'commentId' in n ? n.commentId : null;
  const mentionId = 'mentionId' in n ? n.mentionId : null;
  const bountyId = 'bountyId' in n ? n.bountyId : null;

  if (groupType === 'discussions') {
    return `/${spaceDomain}/${path}?${commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`}`;
  }

  if (groupType === 'bounties') {
    return `/${spaceDomain}/bounties?bountyId=${bountyId}`;
  }

  if (groupType === 'votes') {
    return `/${spaceDomain}/${path}?voteId=${taskId}`;
  }

  if (groupType === 'proposals') {
    return `/${spaceDomain}/${path}`;
  }

  if (groupType === 'forum') {
    return `${spaceDomain}/forum/post/${path}`;
  }

  return '';
}

function getNotificationContent(n: NotificationPreview, groupType: NotificationGroupType) {
  const action = 'action' in n ? n.action : null;
  const title = getNotificationConentTitle(n);
  const commentId = 'commentId' in n ? n.commentId : null;
  const { createdBy } = n;

  if (action === 'application_pending') {
    return `You applied for ${title} bounty.`;
  }

  if (action === 'application_approved') {
    return `You application for ${title} bounty is approved.`;
  }

  if (groupType === 'forum') {
    if (commentId) {
      return createdBy?.username ? `${createdBy?.username} left a comment on ${title}.` : `New comment on ${title}.`;
    }

    return createdBy?.username
      ? `${createdBy?.username} created "${title}" post on forum.`
      : `New forum post "${title}"`;
  }

  if (groupType === 'discussions') {
    return title ? `${createdBy?.username} left a comment in ${title}.` : `${createdBy?.username} left a comment.`;
  }

  if (groupType === 'bounties') {
    return createdBy?.username ? `${createdBy?.username} created a bounty.` : 'Bounty created.';
  }

  if (groupType === 'votes') {
    return createdBy?.username ? `${createdBy?.username} created a poll "${title}".` : `Poll "${title}" created.`;
  }

  if (groupType === 'proposals') {
    return createdBy?.username ? `${createdBy?.username} created a proposal.` : 'Proposal created.';
  }

  return '';
}

function getNotificationTitle(groupType: NotificationGroupType) {
  switch (groupType) {
    case 'discussions':
      return 'Discussion';
    case 'bounties':
      return 'Bounty';
    case 'votes':
      return 'New Poll';
    case 'forum':
      return 'Forum Post';
    case 'proposals':
      return 'Proposal';
    default:
      return '';
  }
}
