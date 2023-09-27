import type { ProposalStatus } from '@charmverse/core/prisma';
import { NotificationType } from '@charmverse/core/prisma';

import type { BountyTask } from 'lib/bounties/getBountyTasks';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import type { ForumTask } from 'lib/forums/getForumNotifications/getForumNotifications';
import type {
  BlockCommentNotificationType,
  CommentNotificationType,
  DiscussionNotification,
  InlineCommentNotificationType,
  NotificationActor,
  NotificationGroupType
} from 'lib/notifications/interfaces';
import type { ProposalTask } from 'lib/proposal/getProposalStatusChangeTasks';
import type { VoteTask } from 'lib/votes/interfaces';

function getCommentTypeNotificationContent({
  notificationType,
  createdBy,
  title
}: {
  notificationType:
    | InlineCommentNotificationType
    | CommentNotificationType
    | 'mention.created'
    | BlockCommentNotificationType;
  title: string;
  createdBy: NotificationActor | null;
}) {
  switch (notificationType) {
    case 'inline_comment.created':
    case 'block_comment.created':
    case 'comment.created': {
      return createdBy?.username ? `${createdBy?.username} left a comment in ${title}.` : `New comment in ${title}.`;
    }
    case 'inline_comment.replied':
    case 'block_comment.replied':
    case 'comment.replied': {
      return createdBy?.username
        ? `${createdBy?.username} replied to your comment in ${title}.`
        : `New reply to your comment in ${title}.`;
    }
    case 'inline_comment.mention.created':
    case 'block_comment.mention.created':
    case 'comment.mention.created':
    case 'mention.created': {
      return createdBy?.username
        ? `${createdBy?.username} mentioned you in ${title}.`
        : `You were mentioned in ${title}.`;
    }
    default: {
      return '';
    }
  }
}

function getForumContent(n: ForumTask) {
  const { createdBy, commentId, postTitle } = n;
  if (commentId) {
    return createdBy?.username
      ? `${createdBy?.username} left a comment on ${postTitle}.`
      : `New comment on ${postTitle}.`;
  }

  return createdBy?.username
    ? `${createdBy?.username} created "${postTitle}" post on forum.`
    : `New forum post "${postTitle}"`;
}

export function getForumNotificationPreviewItems(notifications: ForumTask[]) {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'forum' as NotificationGroupType,
    type: NotificationType.forum,
    href: `/${n.spaceDomain}/forum/post/${n.postPath}`,
    content: getForumContent(n),
    title: 'Forum Post'
  }));
}

function getDiscussionContent(n: DiscussionNotification) {
  const { createdBy, pageTitle, type } = n;
  switch (type) {
    case 'person_assigned': {
      return createdBy?.username
        ? `${createdBy?.username} assigned you to ${pageTitle}.`
        : `You were assigned to ${pageTitle}.`;
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: n.type,
        title: pageTitle
      });
    }
  }
}

export function getDiscussionsNotificationPreviewItems(notifications: DiscussionNotification[]) {
  return notifications.map((n) => {
    const type = n.type;
    const urlSearchParams = new URLSearchParams();
    if (type === 'inline_comment.created' || type === 'inline_comment.replied') {
      urlSearchParams.set('commentId', n.inlineCommentId);
    } else if (type === 'mention.created') {
      urlSearchParams.set('mentionId', n.mentionId);
    } else if (type === 'inline_comment.mention.created') {
      urlSearchParams.set('commentId', n.inlineCommentId);
      urlSearchParams.set('mentionId', n.mentionId);
    }

    return {
      taskId: n.taskId,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
      spaceName: n.spaceName,
      groupType: 'discussions' as NotificationGroupType,
      type: NotificationType.mention,
      href: `/${n.spaceDomain}/${n.pagePath}${
        Array.from(urlSearchParams.values()).length ? `?${urlSearchParams.toString()}` : ''
      }`,
      content: getDiscussionContent(n),
      title: 'Discussion'
    };
  });
}

function getBountyContent(n: BountyTask) {
  const { createdBy, action, pageTitle: title } = n;

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

export function getBountiesNotificationPreviewItems(notifications: BountyTask[]) {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'bounties' as NotificationGroupType,
    type: NotificationType.bounty,
    href: `/${n.spaceDomain}/${n.pagePath}`,
    content: getBountyContent(n),
    title: 'Bounty'
  }));
}

function getProposalContent(n: ProposalTask, currentUserId: string) {
  const status = 'status' in n ? n.status : null;
  const { createdBy, pageTitle: title } = n;
  const isCreator = currentUserId === createdBy?.id;
  if (status) {
    return createdBy?.username
      ? isCreator
        ? `You updated proposal ${title}`
        : `${createdBy?.username} updated proposal ${title}.`
      : `Proposal ${title} updated.`;
  }
  return createdBy?.username
    ? isCreator
      ? `You updated ${title} proposal.`
      : `${createdBy?.username} updated ${title} proposal.`
    : `Proposal ${title} updated.`;
}

function getProposalNotificationStatus(status: ProposalStatus) {
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

export function getProposalsNotificationPreviewItems(notifications: ProposalTask[], currentUserId?: string) {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy || null,
    spaceName: n.spaceName,
    groupType: 'proposals' as NotificationGroupType,
    type: NotificationType.proposal,
    href: `/${n.spaceDomain}/${n.pagePath}`,
    content: getProposalContent(n, currentUserId || ''),
    title: `Proposal: ${getProposalNotificationStatus(n.status)}`
  }));
}

const getVoteContent = (n: VoteTask, currentUserId: string) => {
  const { createdBy, title, userChoice } = n;
  const isCreator = currentUserId === createdBy?.id;
  if (userChoice) {
    return createdBy?.username ? `${createdBy?.username} added a vote in "${title}".` : `New vote in "${title}".`;
  }

  return createdBy?.username
    ? isCreator
      ? `You created new vote "${title}".`
      : `${createdBy?.username} created a poll "${title}".`
    : `Poll "${title}" created.`;
};

export function getVoteNotificationPreviewItems(notifications: VoteTask[], currentUserId?: string) {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'votes' as NotificationGroupType,
    type: NotificationType.vote,
    href: `/${n.spaceDomain}/${n.pagePath}?voteId=${n.taskId}`,
    content: getVoteContent(n, currentUserId || ''),
    title: 'New Poll'
  }));
}
