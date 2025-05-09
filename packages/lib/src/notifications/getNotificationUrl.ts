import { log } from '@charmverse/core/log';
import type {
  BountyNotification,
  CardNotification,
  CustomNotification,
  DocumentNotification,
  PostNotification,
  ProposalNotification,
  VoteNotification
} from '@packages/lib/notifications/interfaces';

function getUrlSearchParamsFromNotificationType(
  notification: Pick<
    DocumentNotification,
    'commentId' | 'inlineCommentId' | 'type' | 'applicationCommentId' | 'mentionId'
  >
): string {
  const urlSearchParams = new URLSearchParams();
  switch (notification.type) {
    case 'comment.created':
    case 'comment.replied':
    case 'comment.mention.created': {
      addSearchParam('commentId', notification.commentId);
      break;
    }
    case 'inline_comment.created':
    case 'inline_comment.replied':
    case 'inline_comment.mention.created': {
      addSearchParam('inlineCommentId', notification.inlineCommentId);
      break;
    }
    case 'application_comment.created':
    case 'application_comment.replied':
    case 'application_comment.mention.created': {
      addSearchParam('commentId', notification.applicationCommentId);
      break;
    }
    default: {
      break;
    }
  }

  if (notification.type.includes('mention')) {
    addSearchParam('mentionId', notification.mentionId);
  }

  function addSearchParam(param: string, value?: string | null) {
    if (value) {
      urlSearchParams.set(param, value);
    }
  }

  const query = urlSearchParams.toString();
  return query ? `?${query}` : '';
}

export function getNotificationUrl(
  notification:
    | Pick<
        DocumentNotification,
        | 'pageType'
        | 'pagePath'
        | 'applicationId'
        | 'commentId'
        | 'inlineCommentId'
        | 'applicationCommentId'
        | 'type'
        | 'group'
        | 'mentionId'
      >
    | Pick<BountyNotification | CardNotification | ProposalNotification, 'pagePath' | 'group'>
    | Pick<PostNotification, 'postPath' | 'group'>
    | Pick<VoteNotification, 'voteId' | 'pagePath' | 'pageType' | 'group'>
    | Pick<CustomNotification, 'content' | 'type' | 'group'>
) {
  try {
    switch (notification.group) {
      case 'bounty':
      case 'card':
      case 'proposal': {
        return `/${notification.pagePath}`;
      }

      case 'document': {
        const basePath =
          notification.pageType === 'post'
            ? `/forum/post/${notification.pagePath}`
            : notification.pageType === 'bounty' && notification.applicationId
              ? `/rewards/applications/${notification.applicationId}`
              : `/${notification.pagePath}`;

        return `${basePath}${getUrlSearchParamsFromNotificationType(notification)}`;
      }

      case 'post': {
        return `/forum/post/${notification.postPath}`;
      }

      case 'vote': {
        return `/${notification.pageType === 'post' ? 'forum/post/' : ''}${notification.pagePath}?voteId=${
          notification.voteId
        }`;
      }

      case 'custom': {
        if (notification.type === 'orange-dao') {
          return `/${notification.content.pageId}`;
        }
        return '';
      }

      default: {
        log.warn('Unrecognized notification type', { notification });
        return '';
      }
    }
  } catch (error) {
    log.warn('Cannot read notification type', { error, notification });
    return '';
  }
}
