import type { ProposalStatus } from '@charmverse/core/prisma';
import { NotificationType } from '@charmverse/core/prisma';

import type {
  BountyNotification,
  CommentNotification,
  DiscussionNotification,
  ForumNotification,
  InlineCommentNotification,
  NotificationActor,
  NotificationGroupType,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';

function getCommentTypeNotificationContent({
  notificationType,
  createdBy,
  title
}: {
  notificationType: InlineCommentNotification['type'] | CommentNotification['type'] | 'mention.created';
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

export function getForumNotificationPreviewItems(notifications: ForumNotification[]) {
  return notifications.map((n) => ({
    id: n.id,
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
  const { type, createdBy, pageTitle } = n;
  switch (type) {
    case 'mention.created': {
      return createdBy?.username
        ? `${createdBy?.username} mentioned you in ${pageTitle}.`
        : `You were mentioned in ${pageTitle}.`;
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

export function getDiscussionsNotificationPreviewItems(notifications: DiscussionNotification[]) {
  return notifications.map((n) => ({
    id: n.id,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'discussions' as NotificationGroupType,
    type: NotificationType.mention,
    href: `/${n.spaceDomain}/${'pagePath' in n && n.pagePath}?mentionId=${n.mentionId}`,
    content: getDiscussionContent(n),
    title: 'Discussion'
  }));
}

function getBountyContent(n: BountyNotification) {
  const { createdBy, type, pageTitle: title } = n;

  switch (type) {
    case 'application.pending': {
      return `${createdBy?.username} applied for ${title} bounty.`;
    }
    case 'application.submitted': {
      return `${createdBy?.username} applied for bounty ${title}.`;
    }
    case 'application.accepted': {
      return `Your application for ${title} bounty was accepted.`;
    }
    case 'application.rejected': {
      return `Your application for ${title} bounty has been rejected.`;
    }
    case 'application.approved': {
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

export function getBountiesNotificationPreviewItems(notifications: BountyNotification[]) {
  return notifications.map((n) => ({
    id: n.id,
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

function getProposalContent(n: ProposalNotification) {
  const { type, createdBy, pageTitle: title } = n;

  switch (type) {
    case 'start_discussion': {
      return createdBy?.username
        ? `${createdBy?.username} seeking feedback for ${title}.`
        : `Feedback requested for ${title}.`;
    }
    case 'start_review': {
      return createdBy?.username
        ? `${createdBy?.username} seeking review for ${title}.`
        : `Review requested for ${title}.`;
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

export function getProposalsNotificationPreviewItems(notifications: ProposalNotification[]) {
  return notifications.map((n) => ({
    id: n.id,
    createdAt: n.createdAt,
    createdBy: n.createdBy || null,
    spaceName: n.spaceName,
    groupType: 'proposals' as NotificationGroupType,
    type: NotificationType.proposal,
    href: `/${n.spaceDomain}/${n.pagePath}`,
    content: getProposalContent(n),
    title: `Proposal: ${getProposalNotificationStatus(n.status)}`
  }));
}

export function getVoteNotificationPreviewItems(notifications: VoteNotification[]) {
  return notifications.map((n) => ({
    id: n.id,
    createdAt: n.createdAt,
    createdBy: n.createdBy,
    spaceName: n.spaceName,
    groupType: 'votes' as NotificationGroupType,
    type: NotificationType.vote,
    href: `/${n.spaceDomain}/${n.pagePath}?voteId=${n.id}`,
    content: `Polling started for "${n.title}".`,
    title: 'New Poll'
  }));
}
