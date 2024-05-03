import { log } from '@charmverse/core/log';
import type { PageType } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';

import { type FeatureJson } from 'lib/features/constants';
import { getFeatureTitle } from 'lib/features/getFeatureTitle';
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
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';

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

function getRewardContent({
  notification,
  rewardTitle,
  authorUsername
}: {
  notification: BountyNotification;
  authorUsername?: string;
  rewardTitle: string;
}): string | ReactNode {
  const { createdBy, type } = notification;
  const username = authorUsername ?? createdBy?.username;
  switch (type) {
    case 'application.created': {
      return (
        <span>
          <strong>{username}</strong> applied for a {rewardTitle}
        </span>
      );
    }
    case 'submission.created': {
      return (
        <span>
          <strong>{username}</strong> applied for a {rewardTitle}
        </span>
      );
    }
    case 'application.approved': {
      return `Your application for a ${rewardTitle} was accepted`;
    }
    case 'application.rejected': {
      return `Your application for a ${rewardTitle} has been rejected`;
    }
    case 'submission.approved': {
      return `Your application for a ${rewardTitle} was approved`;
    }
    case 'application.payment_pending': {
      return `Payment required for a ${rewardTitle}`;
    }
    case 'application.payment_completed': {
      return `You have been paid for a ${rewardTitle}`;
    }
    default: {
      return '';
    }
  }
}

function getProposalContent({
  notification,
  actorUsername,
  spaceFeatures
}: {
  notification: ProposalNotification;
  actorUsername?: string;
  spaceFeatures: FeatureJson[];
}): string | ReactNode {
  const proposalFeatureTitle = getFeatureTitle('proposals', spaceFeatures);
  const { type, createdBy } = notification;
  const username = actorUsername ?? createdBy?.username;
  switch (type) {
    case 'start_discussion': {
      return username ? (
        <span>
          <strong>{username}</strong> requested feedback for a proposal
        </span>
      ) : (
        `Feedback requested for a ${proposalFeatureTitle}`
      );
    }
    case 'vote_passed': {
      return `The vote on ${notification.pageTitle} has passed. View results.`;
    }
    case 'reward_published': {
      return `Your ${proposalFeatureTitle} reward has been created`;
    }
    case 'step_passed': {
      return `Your ${proposalFeatureTitle} has successfully completed the ${notification.previousEvaluation?.title} step and is now moving to the ${notification.evaluation?.title} step`;
    }
    case 'proposal_failed':
    case 'proposal_passed': {
      const actionLabels = getActionButtonLabels(notification.evaluation);
      return `The status of your ${proposalFeatureTitle} has changed to: ${
        type === 'proposal_failed' ? actionLabels.reject : actionLabels.approve
      }`;
    }
    case 'vote': {
      return `Voting started for a ${proposalFeatureTitle}`;
    }
    case 'review_required': {
      return `Review required for a ${proposalFeatureTitle}`;
    }
    default: {
      return '';
    }
  }
}

export function getNotificationMetadata({
  notification,
  actorUsername,
  spaceFeatures = []
}: {
  notification: Notification;
  actorUsername?: string;
  spaceFeatures: FeatureJson[];
}): {
  href: string;
  content: ReactNode;
  pageTitle: string;
} {
  const href = getNotificationUrl(notification);

  try {
    switch (notification.group) {
      case 'bounty': {
        return {
          content: getRewardContent({
            notification: notification as BountyNotification,
            authorUsername: actorUsername,
            rewardTitle: getFeatureTitle('reward', spaceFeatures)
          }),
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
          content: getProposalContent({
            notification: notification as ProposalNotification,
            actorUsername,
            spaceFeatures
          }),
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
