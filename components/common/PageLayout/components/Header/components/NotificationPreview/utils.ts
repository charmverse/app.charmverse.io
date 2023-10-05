import type { ProposalStatus } from '@charmverse/core/prisma';
import { NotificationType } from '@charmverse/core/prisma';

import type {
  BountyNotification,
  CommentNotificationType,
  DiscussionNotification,
  InlineCommentNotificationType,
  NotificationActor,
  NotificationGroupType,
  ForumNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';

import type { NotificationDetails } from './useNotifications';

function getUrlSearchParamsFromNotificationType(
  notification:
    | DiscussionNotification
    | ForumNotification
    | BountyNotification
    | ProposalNotification
    | VoteNotification
) {
  const urlSearchParams = new URLSearchParams();
  switch (notification.type) {
    case 'comment.created':
    case 'comment.replied':
    case 'comment.mention.created': {
      urlSearchParams.set('commentId', notification.commentId);
      break;
    }
    case 'inline_comment.created':
    case 'inline_comment.replied':
    case 'inline_comment.mention.created': {
      urlSearchParams.set('inlineCommentId', notification.inlineCommentId);
      break;
    }
    default: {
      break;
    }
  }

  return Array.from(urlSearchParams.values()).length ? `?${urlSearchParams.toString()}` : '';
}

function getCommentTypeNotificationContent({
  notificationType,
  createdBy,
  title
}: {
  notificationType: InlineCommentNotificationType | CommentNotificationType | 'mention.created';
  title: string;
  createdBy: NotificationActor | null;
}) {
  switch (notificationType) {
    case 'inline_comment.created':
    case 'comment.created': {
      return createdBy?.username ? `${createdBy?.username} left a comment in ${title}.` : `New comment in ${title}.`;
    }
    case 'inline_comment.replied':
    case 'comment.replied': {
      return createdBy?.username
        ? `${createdBy?.username} replied to your comment in ${title}.`
        : `New reply to your comment in ${title}.`;
    }
    case 'inline_comment.mention.created':
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

function getForumContent(n: ForumNotification) {
  const { createdBy, postTitle, type } = n;
  switch (type) {
    case 'created': {
      return createdBy?.username
        ? `${createdBy?.username} created "${postTitle}".`
        : `New forum post "${postTitle}" created`;
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: type,
        title: postTitle
      });
    }
  }
}

export function getForumNotificationPreviewItems(notifications: ForumNotification[]): NotificationDetails[] {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'forum' as NotificationGroupType,
    type: NotificationType.forum,
    spaceDomain: n.spaceDomain,
    pagePath: `/forum/post/${n.postPath}${getUrlSearchParamsFromNotificationType(n)}`,
    content: getForumContent(n),
    title: 'Forum Post'
  }));
}

function getDiscussionContent(n: DiscussionNotification) {
  const { type, createdBy, pageTitle } = n;
  switch (type) {
    case 'mention.created': {
      return createdBy?.username
        ? `${createdBy?.username} mentioned you in ${pageTitle}.`
        : `You were mentioned in ${pageTitle}.`;
    }
    case 'person_assigned': {
      return createdBy?.username
        ? `${createdBy?.username} assigned you to ${pageTitle}.`
        : `You were assigned to ${pageTitle}.`;
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: type,
        title: pageTitle
      });
    }
  }
}

export function getDiscussionsNotificationPreviewItems(notifications: DiscussionNotification[]): NotificationDetails[] {
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
      spaceDomain: n.spaceDomain,
      pagePath: n.pagePath + getUrlSearchParamsFromNotificationType(n),
      content: getDiscussionContent(n),
      title: 'Discussion'
    };
  });
}

function getBountyContent(n: BountyNotification) {
  const { createdBy, type, pageTitle: title } = n;

  switch (type) {
    case 'application.created': {
      return `${createdBy?.username} applied for ${title} bounty.`;
    }
    case 'submission.created': {
      return `${createdBy?.username} applied for bounty ${title}.`;
    }
    case 'application.approved': {
      return `Your application for ${title} bounty was accepted.`;
    }
    case 'application.rejected': {
      return `Your application for ${title} bounty has been rejected.`;
    }
    case 'submission.approved': {
      return `Your application for ${title} bounty was approved.`;
    }
    case 'application.payment_pending': {
      return `Payment required for ${title}.`;
    }
    case 'application.payment_completed': {
      return `You have been paid for ${title}.`;
    }
    case 'suggestion.created': {
      return createdBy?.username
        ? `${createdBy?.username} suggested a new bounty: ${title}.`
        : `New bounty suggestion: ${title}.`;
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: type,
        title
      });
    }
  }
}

export function getBountiesNotificationPreviewItems(notifications: BountyNotification[]): NotificationDetails[] {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'bounties' as NotificationGroupType,
    type: NotificationType.bounty,
    spaceDomain: n.spaceDomain,
    pagePath: n.pagePath + getUrlSearchParamsFromNotificationType(n),
    content: getBountyContent(n),
    title: 'Bounty'
  }));
}

function getProposalContent(n: ProposalNotification) {
  const { type, createdBy, pageTitle: title } = n;

  switch (type) {
    case 'start_review':
    case 'start_discussion': {
      return createdBy?.username
        ? `${createdBy?.username} seeking feedback for ${title}.`
        : `Feedback requested for ${title}.`;
    }
    case 'reviewed': {
      return `Review completed for ${title}`;
    }
    case 'vote': {
      return `Voting started for ${title}`;
    }
    case 'needs_review': {
      return `Review required for ${title}`;
    }
    case 'evaluation_active': {
      return `Evaluation started for ${title}`;
    }
    case 'evaluation_closed': {
      return `Evaluation completed for ${title}`;
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: type,
        title
      });
    }
  }
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

export function getProposalsNotificationPreviewItems(notifications: ProposalNotification[]): NotificationDetails[] {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy || null,
    spaceName: n.spaceName,
    groupType: 'proposals' as NotificationGroupType,
    type: NotificationType.proposal,
    spaceDomain: n.spaceDomain,
    pagePath: n.pagePath + getUrlSearchParamsFromNotificationType(n),
    content: getProposalContent(n),
    title: `Proposal: ${getProposalNotificationStatus(n.status)}`
  }));
}

export function getVoteNotificationPreviewItems(notifications: VoteNotification[]): NotificationDetails[] {
  return notifications.map((n) => ({
    taskId: n.taskId,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'votes' as NotificationGroupType,
    type: NotificationType.vote,
    spaceDomain: n.spaceDomain,
    pagePath: `${n.pageType === 'post' ? 'forum/post/' : ''}${n.pagePath}?voteId=${n.voteId}`,
    content: `Polling started for "${n.title}".`,
    title: 'New Poll'
  }));
}
