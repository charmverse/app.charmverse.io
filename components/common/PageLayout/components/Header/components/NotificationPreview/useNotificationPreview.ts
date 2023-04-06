import type { BountyStatus, ProposalStatus, VoteStatus } from '@prisma/client';
import { NotificationType } from '@prisma/client';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { useTasks } from 'components/nexus/hooks/useTasks';
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
      ...getVoteNotificationPreviewItems(tasks.votes.unmarked, currentUserId),
      ...getProposalsNotificationPreviewItems(tasks.proposals.unmarked, currentUserId),
      ...getBountiesNotificationPreviewItems(tasks.bounties.unmarked),
      ...getDiscussionsNotificationPreviewItems(tasks.discussions.unmarked),
      ...getForumNotificationPreviewItems(tasks.forum.unmarked)
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);

  const markedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!tasks) return [];
    return [
      ...getVoteNotificationPreviewItems(tasks.votes.marked, currentUserId),
      ...getProposalsNotificationPreviewItems(tasks.proposals.marked, currentUserId),
      ...getBountiesNotificationPreviewItems(tasks.bounties.marked),
      ...getDiscussionsNotificationPreviewItems(tasks.discussions.marked),
      ...getForumNotificationPreviewItems(tasks.forum.marked)
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

const pagePath = (n: NotificationPreview) => ('pagePath' in n ? n.pagePath : null);
const postPath = (n: NotificationPreview) => ('postPath' in n ? n.postPath : null);

function getForumNotificationPreviewItems(notifications: NotificationPreview[]) {
  const forumContent = (n: NotificationPreview) => {
    const { createdBy } = n;
    const commentId = 'commentId' in n ? n.commentId : null;
    const title = getNotificationConentTitle(n);

    if (commentId) {
      return createdBy?.username ? `${createdBy?.username} left a comment on ${title}.` : `New comment on ${title}.`;
    }
    return createdBy?.username
      ? `${createdBy?.username} created "${title}" post on forum.`
      : `New forum post "${title}"`;
  };

  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'forum' as NotificationGroupType,
    type: NotificationType.forum,
    href: `/${n.spaceDomain}/forum/post/${postPath(n)}`,
    content: forumContent(n),
    title: 'Forum Post'
  }));
}

function getDiscussionsNotificationPreviewItems(notifications: NotificationPreview[]) {
  const commentId = (n: NotificationPreview) => ('commentId' in n ? n.commentId : null);
  const mentionId = (n: NotificationPreview) => ('mentionId' in n ? n.mentionId : null);

  const discussionContent = (n: NotificationPreview) => {
    const { createdBy } = n;
    const title = getNotificationConentTitle(n);

    return title ? `${createdBy?.username} left a comment in ${title}.` : `${createdBy?.username} left a comment.`;
  };

  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'discussions' as NotificationGroupType,
    type: NotificationType.mention,
    href: `/${n.spaceDomain}/${'pagePath' in n && n.pagePath}?${
      commentId(n) ? `commentId=${commentId(n)}` : `mentionId=${mentionId(n)}`
    }`,
    content: discussionContent(n),
    title: 'Discussion'
  }));
}

function getBountiesNotificationPreviewItems(notifications: NotificationPreview[]) {
  const bountyContent = (n: NotificationPreview) => {
    const action = 'action' in n ? n.action : null;
    const title = getNotificationConentTitle(n);
    const { createdBy } = n;

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
  };

  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'bounties' as NotificationGroupType,
    type: NotificationType.bounty,
    href: `/${n.spaceDomain}/${pagePath(n)}`,
    content: bountyContent(n),
    title: 'Bounty'
  }));
}

function getProposalsNotificationPreviewItems(notifications: NotificationPreview[], currentUserId?: string) {
  const proposalContent = (n: NotificationPreview) => {
    const status = 'status' in n ? n.status : null;
    const { createdBy } = n;
    const isCreator = currentUserId === createdBy?.id;
    const pageTitle = 'pageTitle' in n ? n.pageTitle : null;
    const title = getNotificationConentTitle(n);

    if (status) {
      return createdBy?.username
        ? isCreator
          ? `You updated proposal ${pageTitle}`
          : `${createdBy?.username} updated proposal ${pageTitle}.`
        : `Proposal ${pageTitle} updated.`;
    }
    return createdBy?.username
      ? isCreator
        ? `You updated ${title} proposal.`
        : `${createdBy?.username} updated ${title} proposal.`
      : `Proposal ${title} updated.`;
  };

  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'proposals' as NotificationGroupType,
    type: NotificationType.proposal,
    href: `/${n.spaceDomain}/${pagePath(n)}`,
    content: proposalContent(n),
    title: `Proposal: ${getNotificationStatus('status' in n ? n.status : null)}`
  }));
}

function getVoteNotificationPreviewItems(notifications: NotificationPreview[], currentUserId?: string) {
  const voteContent = (n: NotificationPreview) => {
    const { createdBy } = n;
    const isCreator = currentUserId === createdBy?.id;
    const title = getNotificationConentTitle(n);
    const userChoice = 'userChoice' in n ? n.userChoice : null;

    if (userChoice) {
      return createdBy?.username ? `${createdBy?.username} added a vote in "${title}".` : `New vote in "${title}".`;
    }
    return createdBy?.username
      ? isCreator
        ? `You created new vote "${title}".`
        : `${createdBy?.username} created a poll "${title}".`
      : `Poll "${title}" created.`;
  };

  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'votes' as NotificationGroupType,
    type: NotificationType.vote,
    href: `/${n.spaceDomain}/${pagePath(n)}?voteId=${n.taskId}`,
    content: voteContent(n),
    title: 'New Poll'
  }));
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
