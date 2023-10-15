import type { PageType } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';

import type {
  BountyNotification,
  CardNotification,
  CommentNotificationType,
  DocumentNotification,
  InlineCommentNotificationType,
  Notification,
  NotificationActor,
  PostNotification,
  ProposalNotification
} from 'lib/notifications/interfaces';

function getUrlSearchParamsFromNotificationType(notification: Notification) {
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
  const query = urlSearchParams.toString();
  return query ? `?${query}` : '';
}

function getCommentTypeNotificationContent({
  notificationType,
  createdBy,
  pageType
}: {
  notificationType: InlineCommentNotificationType | CommentNotificationType | 'mention.created';
  createdBy: NotificationActor | null;
  pageType: PageType | 'post';
}) {
  switch (notificationType) {
    case 'inline_comment.created':
    case 'comment.created': {
      return createdBy?.username ? (
        <span>
          <strong>{createdBy?.username}</strong> left a comment in a {pageType}
        </span>
      ) : (
        `New comment in a ${pageType}`
      );
    }
    case 'inline_comment.replied':
    case 'comment.replied': {
      return createdBy?.username ? (
        <span>
          <strong>{createdBy?.username}</strong> replied to your comment in a {pageType}
        </span>
      ) : (
        `New reply to your comment in a ${pageType}`
      );
    }
    case 'inline_comment.mention.created':
    case 'comment.mention.created':
    case 'mention.created': {
      return createdBy?.username ? (
        <span>
          <strong>{createdBy?.username}</strong> mentioned you in a {pageType}
        </span>
      ) : (
        `You were mentioned in a ${pageType}`
      );
    }
    default: {
      return '';
    }
  }
}

function getPostContent(n: PostNotification) {
  const { createdBy, type } = n;
  switch (type) {
    case 'created': {
      return createdBy?.username ? (
        <span>
          <strong>{createdBy?.username}</strong> created a new forum post
        </span>
      ) : (
        `New forum post created`
      );
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: type,
        pageType: 'post'
      });
    }
  }
}

function getCardContent(n: CardNotification) {
  const { createdBy, type } = n;
  switch (type) {
    case 'person_assigned': {
      return createdBy.username ? (
        <span>{createdBy.username} assigned you to a card</span>
      ) : (
        `You were assigned to a card`
      );
    }
    default: {
      throw new Error(`Type Not implemented for card notifications: ${type}`);
    }
  }
}

function getDocumentContent(n: DocumentNotification) {
  const { type, createdBy, pageType } = n;
  return getCommentTypeNotificationContent({
    createdBy,
    notificationType: type,
    pageType
  });
}

function getBountyContent(n: BountyNotification) {
  const { createdBy, type } = n;

  switch (type) {
    case 'application.created': {
      return (
        <span>
          <strong>{createdBy?.username}</strong> applied for a bounty
        </span>
      );
    }
    case 'submission.created': {
      return (
        <span>
          <strong>{createdBy?.username}</strong> applied for a bounty
        </span>
      );
    }
    case 'application.approved': {
      return `Your application for a bounty was accepted`;
    }
    case 'application.rejected': {
      return `Your application for a bounty has been rejected`;
    }
    case 'submission.approved': {
      return `Your application for a bounty was approved`;
    }
    case 'application.payment_pending': {
      return `Payment required for a bounty`;
    }
    case 'application.payment_completed': {
      return `You have been paid for a bounty`;
    }
    case 'suggestion.created': {
      return createdBy?.username ? (
        <span>
          <strong>{createdBy?.username}</strong> suggested a new bounty
        </span>
      ) : (
        `New bounty suggestion`
      );
    }
    default: {
      return '';
    }
  }
}

function getProposalContent(n: ProposalNotification) {
  const { type, createdBy, pageTitle: title } = n;

  switch (type) {
    case 'start_review':
    case 'start_discussion': {
      return createdBy?.username ? (
        <span>
          <strong>{createdBy?.username}</strong> requested feedback for a proposal
        </span>
      ) : (
        `Feedback requested for a proposal`
      );
    }
    case 'reviewed': {
      return `Review completed for a proposal`;
    }
    case 'vote': {
      return `Voting started for a proposal`;
    }
    case 'needs_review': {
      return `Review required for a proposal`;
    }
    case 'evaluation_active': {
      return `Evaluation started for a proposal`;
    }
    case 'evaluation_closed': {
      return `Evaluation completed for a proposal`;
    }
    default: {
      return '';
    }
  }
}

export function getNotificationMetadata(notification: Notification): {
  href: string;
  content: ReactNode;
  pageTitle: string;
} {
  switch (notification.group) {
    case 'bounty': {
      return {
        content: getBountyContent(notification as BountyNotification),
        href: `/${notification.pagePath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.pageTitle
      };
    }

    case 'card': {
      return {
        content: getCardContent(notification as CardNotification),
        href: `/${notification.pagePath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.pageTitle
      };
    }

    case 'document': {
      return {
        content: getDocumentContent(notification as DocumentNotification),
        href: `/${notification.pagePath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.pageTitle
      };
    }

    case 'post': {
      return {
        content: getPostContent(notification as PostNotification),
        href: `/forum/post/${notification.postPath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.postTitle
      };
    }

    case 'proposal': {
      return {
        content: getProposalContent(notification as ProposalNotification),
        href: `/${notification.pagePath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.pageTitle
      };
    }

    case 'vote': {
      return {
        content: `Polling started for "${notification.title}"`,
        href: `/${notification.pageType === 'post' ? 'forum/post/' : ''}${notification.pagePath}?voteId=${
          notification.voteId
        }`,
        pageTitle: notification.pageTitle
      };
    }

    default: {
      return {
        content: '',
        href: '',
        pageTitle: ''
      };
    }
  }
}
