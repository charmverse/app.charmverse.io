import type { BountyStatus, ProposalStatus, VoteStatus } from '@prisma/client';
import { NotificationType } from '@prisma/client';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';
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
  const { user } = useUser();
  const currentUserId = user?.id;

  const unmarkedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!tasks) return [];
    return [
      ...getNotificationPreviewItems(tasks.votes.unmarked, 'votes', currentUserId),
      ...getNotificationPreviewItems(tasks.proposals.unmarked, 'proposals', currentUserId),
      ...getNotificationPreviewItems(tasks.bounties.unmarked, 'bounties', currentUserId),
      ...getNotificationPreviewItems(tasks.discussions.unmarked, 'discussions', currentUserId),
      ...getNotificationPreviewItems(tasks.forum.unmarked, 'forum', currentUserId)
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);

  const markedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!tasks) return [];
    return [
      ...getNotificationPreviewItems(tasks.votes.marked, 'votes', currentUserId),
      ...getNotificationPreviewItems(tasks.proposals.marked, 'proposals', currentUserId),
      ...getNotificationPreviewItems(tasks.bounties.marked, 'bounties', currentUserId),
      ...getNotificationPreviewItems(tasks.discussions.marked, 'discussions', currentUserId),
      ...getNotificationPreviewItems(tasks.forum.marked, 'forum', currentUserId)
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
            const marked = [_tasks?.[groupType].unmarked[taskIndex], ..._tasks[groupType].marked];
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

  return { unmarkedNotificationPreviews, markedNotificationPreviews, markAsRead };
}

function getNotificationPreviewItems(
  notifications: NotificationPreview[],
  groupType: NotificationGroupType,
  currentUserId?: string
) {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType,
    type: getNotificationPreviewType(groupType),
    href: getNotificationHref(n, groupType),
    content: getNotificationContent(n, groupType, currentUserId),
    title: getNotificationTitle(n, groupType)
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

  if (groupType === 'proposals' || groupType === 'bounties' || ('type' in n && n.type === 'proposal')) {
    return `/${spaceDomain}/${path}`;
  }

  if (groupType === 'discussions') {
    return `/${spaceDomain}/${path}?${commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`}`;
  }
  if (groupType === 'votes') {
    return `/${spaceDomain}/${path}?voteId=${taskId}`;
  }

  if (groupType === 'forum') {
    return `/${spaceDomain}/forum/post/${path}`;
  }

  return '';
}

function getNotificationContent(n: NotificationPreview, groupType: NotificationGroupType, currentUserId?: string) {
  const action = 'action' in n ? n.action : null;
  const status = 'status' in n ? n.status : null;
  const pageTitle = 'pageTitle' in n ? n.pageTitle : null;
  const userChoice = 'userChoice' in n ? n.userChoice : null;
  const title = getNotificationConentTitle(n);
  const commentId = 'commentId' in n ? n.commentId : null;
  const { createdBy } = n;
  const isCreator = currentUserId === createdBy?.id;

  if (groupType === 'bounties') {
    if (action === 'application_pending') {
      return `${createdBy?.username} applied for ${title} bounty.`;
    }

    if (action === 'work_submitted') {
      return `${createdBy?.username} submitted work for ${title} bounty.`;
    }

    if (action === 'application_approved') {
      return `Your application for ${title} bounty was approved.`;
    }

    if (action === 'application_rejected') {
      return `Your application for ${title} bounty has been rejected.`;
    }

    if (action === 'work_approved') {
      return `Your submission for ${title} bounty was approved.`;
    }

    if (action === 'payment_needed') {
      return `Bounty ${title} is ready for payment.`;
    }

    if (action === 'payment_complete') {
      return `Bounty ${title} has been paid.`;
    }

    if (action === 'suggested_bounty') {
      return createdBy?.username ? `${createdBy?.username} suggested new ${title} bounty.` : 'New bounty suggestion.';
    }

    return createdBy?.username
      ? `${createdBy?.username} updated ${title} bounty status.`
      : `Bounty status ${title} updated.`;
  }

  if (groupType === 'votes' && userChoice) {
    return createdBy?.username ? `${createdBy?.username} added a vote in "${title}".` : `New vote in "${title}".`;
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

  if (groupType === 'votes') {
    return createdBy?.username
      ? isCreator
        ? `You created new vote "${title}".`
        : `${createdBy?.username} created a poll "${title}".`
      : `Poll "${title}" created.`;
  }

  if (groupType === 'proposals' && status) {
    return createdBy?.username
      ? isCreator
        ? `You updated proposal ${pageTitle}`
        : `${createdBy?.username} updated proposal ${pageTitle}.`
      : `Proposal ${pageTitle} updated.`;
  }

  if (groupType === 'proposals') {
    return createdBy?.username
      ? isCreator
        ? `You updated ${title} proposal.`
        : `${createdBy?.username} updated ${title} proposal.`
      : `Proposal ${title} updated.`;
  }

  return '';
}

function getNotificationTitle(n: NotificationPreview, groupType: NotificationGroupType) {
  const status = 'status' in n ? n.status : null;

  if (groupType === 'discussions' && 'type' in n && n.type === 'proposal') {
    return 'Proposal Discussion';
  }

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
      return `Proposal: ${getNotificationStatus(status)}`;
    default:
      return '';
  }
}

function getNotificationStatus(status: VoteStatus | ProposalStatus | BountyStatus | null) {
  switch (status) {
    case 'discussion':
      return 'Discussion';
    case 'review':
      return 'In Review';
    case 'reviewed':
      return 'Reviewed';
    case 'vote_active':
      return 'Vote Active';
    default:
      return '';
  }
}
