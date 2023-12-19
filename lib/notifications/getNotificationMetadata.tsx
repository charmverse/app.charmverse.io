import { log } from '@charmverse/core/log';
import type { PageType } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';

import type {
  ApplicationCommentNotificationType,
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

import { getNotificationUrl } from './getNotificationUrl';

function getCommentTypeNotificationContent({
  notificationType,
  createdBy,
  pageType,
  actorUsername
}: {
  actorUsername?: string;
  notificationType:
    | InlineCommentNotificationType
    | CommentNotificationType
    | ApplicationCommentNotificationType
    | 'mention.created';
  createdBy: NotificationActor | null;
  pageType: PageType | 'post' | 'reward';
}): string | ReactNode {
  const username = actorUsername ?? createdBy?.username;
  switch (notificationType) {
    case 'inline_comment.created':
    case 'application_comment.created':
    case 'comment.created': {
      return username ? (
        <span>
          <strong>{username}</strong> left a comment in a {pageType}
        </span>
      ) : (
        `New comment in a ${pageType}`
      );
    }
    case 'inline_comment.replied':
    case 'application_comment.replied':
    case 'comment.replied': {
      return username ? (
        <span>
          <strong>{username}</strong> replied to your comment in a {pageType}
        </span>
      ) : (
        `New reply to your comment in a ${pageType}`
      );
    }

    case 'mention.created': {
      return username ? (
        <span>
          <strong>{username}</strong> mentioned you in a {pageType}
        </span>
      ) : (
        `You were mentioned in a ${pageType}`
      );
    }

    case 'inline_comment.mention.created':
    case 'application_comment.mention.created':
    case 'comment.mention.created': {
      return username ? (
        <span>
          <strong>{username}</strong> mentioned you in a comment
        </span>
      ) : (
        `You were mentioned in a comment`
      );
    }

    default: {
      return '';
    }
  }
}

function getPostContent(n: PostNotification, actorUsername?: string): string | ReactNode {
  const { createdBy, type } = n;
  const username = actorUsername ?? createdBy?.username;
  switch (type) {
    case 'created': {
      return username ? (
        <span>
          <strong>{username}</strong> created a new forum post
        </span>
      ) : (
        `New forum post created`
      );
    }
    default: {
      return getCommentTypeNotificationContent({
        createdBy,
        notificationType: type,
        pageType: 'post',
        actorUsername
      });
    }
  }
}

function getCardContent(n: CardNotification, actorUsername?: string): string | ReactNode {
  const { createdBy, type } = n;
  const username = actorUsername ?? createdBy?.username;
  switch (type) {
    case 'person_assigned': {
      return username ? (
        <span>
          <strong>{username}</strong> mentioned you in a page
        </span>
      ) : (
        `You were mentioned in a page`
      );
    }
    default: {
      throw new Error(`Type Not implemented for card notifications: ${type}`);
    }
  }
}

function getDocumentContent(n: DocumentNotification, actorUsername?: string): string | ReactNode {
  const { type, createdBy, pageType } = n;
  return getCommentTypeNotificationContent({
    createdBy,
    notificationType: type,
    pageType: pageType === 'bounty' ? 'reward' : pageType,
    actorUsername
  });
}

function getRewardContent(n: BountyNotification, authorUsername?: string): string | ReactNode {
  const { createdBy, type } = n;
  const username = authorUsername ?? createdBy?.username;
  switch (type) {
    case 'application.created': {
      return (
        <span>
          <strong>{username}</strong> applied for a reward
        </span>
      );
    }
    case 'submission.created': {
      return (
        <span>
          <strong>{username}</strong> applied for a reward
        </span>
      );
    }
    case 'application.approved': {
      return `Your application for a reward was accepted`;
    }
    case 'application.rejected': {
      return `Your application for a reward has been rejected`;
    }
    case 'submission.approved': {
      return `Your application for a reward was approved`;
    }
    case 'application.payment_pending': {
      return `Payment required for a reward`;
    }
    case 'application.payment_completed': {
      return `You have been paid for a reward`;
    }
    case 'suggestion.created': {
      return username ? (
        <span>
          <strong>{username}</strong> suggested a new reward
        </span>
      ) : (
        `New reward suggestion`
      );
    }
    default: {
      return '';
    }
  }
}

function getProposalContent(n: ProposalNotification, actorUsername?: string): string | ReactNode {
  const { type, createdBy } = n;
  const username = actorUsername ?? createdBy?.username;
  switch (type) {
    case 'start_review':
    case 'start_discussion': {
      return username ? (
        <span>
          <strong>{username}</strong> requested feedback for a proposal
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

export function getNotificationMetadata(
  notification: Notification,
  actorUsername?: string
): {
  href: string;
  content: ReactNode;
  pageTitle: string;
} {
  const href = getNotificationUrl(notification);
  try {
    switch (notification.group) {
      case 'bounty': {
        return {
          content: getRewardContent(notification as BountyNotification, actorUsername),
          href,
          pageTitle: notification.pageTitle
        };
      }

      case 'card': {
        return {
          content: getCardContent(notification as CardNotification, actorUsername),
          href,
          pageTitle: notification.pageTitle
        };
      }

      case 'document': {
        const basePath =
          notification.pageType === 'post'
            ? `/forum/post/${notification.pagePath}`
            : notification.pageType === 'bounty' && notification.applicationId
            ? `/rewards/applications/${notification.applicationId}`
            : `/${notification.pagePath}`;
        return {
          content: getDocumentContent(notification as DocumentNotification, actorUsername),
          href,
          pageTitle: notification.pageTitle
        };
      }

      case 'post': {
        return {
          content: getPostContent(notification as PostNotification, actorUsername),
          href,
          pageTitle: notification.postTitle
        };
      }

      case 'proposal': {
        return {
          content: getProposalContent(notification as ProposalNotification, actorUsername),
          href,
          pageTitle: notification.pageTitle
        };
      }

      case 'vote': {
        return {
          content: `Polling started for "${notification.title}"`,
          href,
          pageTitle: notification.pageTitle
        };
      }

      default: {
        log.warn('Unrecognized notification type', { notification });
        return {
          content: '',
          href: '',
          pageTitle: ''
        };
      }
    }
  } catch (error) {
    log.warn('Cannot read notification type', { error, notification });
    return {
      content: '',
      href: '',
      pageTitle: ''
    };
  }
}
