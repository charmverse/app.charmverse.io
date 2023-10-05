import type {
  BountyNotification,
  CardNotification,
  CommentNotificationType,
  DiscussionNotification,
  DocumentNotification,
  InlineCommentNotificationType,
  Notification,
  NotificationActor,
  PostNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';

function getUrlSearchParamsFromNotificationType(
  notification: DiscussionNotification | PostNotification | BountyNotification | ProposalNotification | VoteNotification
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
      return createdBy?.username ? `${createdBy?.username} left a comment in ${title}` : `New comment in ${title}`;
    }
    case 'inline_comment.replied':
    case 'comment.replied': {
      return createdBy?.username
        ? `${createdBy?.username} replied to your comment in ${title}`
        : `New reply to your comment in ${title}`;
    }
    case 'inline_comment.mention.created':
    case 'comment.mention.created':
    case 'mention.created': {
      return createdBy?.username
        ? `${createdBy?.username} mentioned you in ${title}`
        : `You were mentioned in ${title}`;
    }
    default: {
      return '';
    }
  }
}

function getForumContent(n: PostNotification) {
  const { createdBy, postTitle, type } = n;
  switch (type) {
    case 'created': {
      return createdBy?.username
        ? `${createdBy?.username} created "${postTitle}"`
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

function getDiscussionContent(n: DiscussionNotification) {
  const { type, createdBy, pageTitle } = n;
  switch (type) {
    case 'mention.created': {
      return createdBy?.username
        ? `${createdBy?.username} mentioned you in ${pageTitle}`
        : `You were mentioned in ${pageTitle}`;
    }
    case 'person_assigned': {
      return createdBy?.username
        ? `${createdBy?.username} assigned you to ${pageTitle}`
        : `You were assigned to ${pageTitle}`;
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
      return `Your application for ${title} bounty has been rejected`;
    }
    case 'submission.approved': {
      return `Your application for ${title} bounty was approved.`;
    }
    case 'application.payment_pending': {
      return `Payment required for ${title}`;
    }
    case 'application.payment_completed': {
      return `You have been paid for ${title}`;
    }
    case 'suggestion.created': {
      return createdBy?.username
        ? `${createdBy?.username} suggested a new bounty: ${title}`
        : `New bounty suggestion: ${title}`;
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

function getProposalContent(n: ProposalNotification) {
  const { type, createdBy, pageTitle: title } = n;

  switch (type) {
    case 'start_review':
    case 'start_discussion': {
      return createdBy?.username
        ? `${createdBy?.username} seeking feedback for ${title}`
        : `Feedback requested for ${title}`;
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

export function getNotificationMetadata(notification: Notification): {
  href: string;
  content: string;
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
        content: getDiscussionContent(notification as CardNotification),
        href: `/${notification.pagePath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.pageTitle
      };
    }

    case 'document': {
      return {
        content: getDiscussionContent(notification as DocumentNotification),
        href: `/${notification.pagePath}${getUrlSearchParamsFromNotificationType(notification)}`,
        pageTitle: notification.pageTitle
      };
    }

    case 'post': {
      return {
        content: getForumContent(notification as PostNotification),
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
