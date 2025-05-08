import type {
  BountyStatus,
  PageType,
  ProposalEvaluation,
  ProposalStatus,
  User,
  VoteStatus
} from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { CardPropertyEntity, WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';

import type { notificationGroups, bountyNotificationTypes, proposalNotificationTypes } from './constants';

export type NotificationGroup = (typeof notificationGroups)[number];

export type NotificationActor = Pick<
  User,
  'id' | 'username' | 'path' | 'avatar' | 'avatarContract' | 'avatarTokenId' | 'avatarChain' | 'deletedAt'
>;

export type CommentNotification =
  | {
      type: 'comment.created';
      commentId: string;
    }
  | {
      type: 'comment.replied';
      commentId: string;
    }
  | {
      type: 'comment.mention.created';
      mentionId: string;
      commentId: string;
    };

export type InlineCommentNotification =
  | {
      type: 'inline_comment.created';
      inlineCommentId: string;
    }
  | {
      type: 'inline_comment.replied';
      inlineCommentId: string;
    }
  | {
      type: 'inline_comment.mention.created';
      mentionId: string;
      inlineCommentId: string;
    };

export type ApplicationCommentNotification =
  | {
      type: 'application_comment.created';
      applicationCommentId: string;
    }
  | {
      type: 'application_comment.replied';
      applicationCommentId: string;
    }
  | {
      type: 'application_comment.mention.created';
      mentionId: string;
      applicationCommentId: string;
    };

export type MentionNotification = {
  type: 'mention.created';
  mentionId: string;
};

export type CommentNotificationType = CommentNotification['type'];
export type InlineCommentNotificationType = InlineCommentNotification['type'];
export type ApplicationCommentNotificationType = ApplicationCommentNotification['type'];
export type MentionNotificationType = MentionNotification['type'];

export interface NotificationBase {
  id: string;
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  createdAt: string;
  createdBy: NotificationActor;
  read: boolean;
  archived: boolean;
  group: 'card' | 'document' | 'post' | 'proposal' | 'vote' | 'bounty' | 'custom';
}

export type CardNotification = NotificationBase & {
  pageId: string;
  pagePath: string;
  pageTitle: string;
  type: 'person_assigned';
  personProperty: {
    id: string;
    name: string;
  } | null;
  group: 'card';
};

export type CardNotificationType = CardNotification['type'];

interface DocumentNotificationBase extends NotificationBase {
  pageId: string;
  pagePath: string;
  pageTitle: string;
  type:
    | InlineCommentNotificationType
    | MentionNotificationType
    | CommentNotificationType
    | ApplicationCommentNotificationType;
  content: PageContent | null;
  mentionId: null | string;
  inlineCommentId: null | string;
  commentId: null | string;
  pageType: PageType | 'post';
  group: 'document';
  applicationId: null | string;
  applicationCommentId: null | string;
}

export type DocumentNotification = DocumentNotificationBase &
  (
    | CommentNotification
    | MentionNotification
    | InlineCommentNotification
    | (ApplicationCommentNotification & { applicationId: string })
  );

export type DocumentNotificationType = DocumentNotification['type'];

export type PostNotificationType = 'created';

export interface PostNotification extends NotificationBase {
  type: PostNotificationType;
  postId: string;
  postPath: string;
  postTitle: string;
  group: 'post';
}

export type ProposalNotificationType = (typeof proposalNotificationTypes)[number];

export type ProposalNotification = NotificationBase & {
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
  pageId: string;
  type: ProposalNotificationType;
  group: 'proposal';
  evaluation: Pick<ProposalEvaluation, 'title'> & {
    actionLabels?: WorkflowEvaluationJson['actionLabels'];
    notificationLabels?: WorkflowEvaluationJson['actionLabels'];
  };
  previousEvaluation:
    | (Pick<ProposalEvaluation, 'title'> & {
        actionLabels?: WorkflowEvaluationJson['actionLabels'];
        notificationLabels?: WorkflowEvaluationJson['actionLabels'];
      })
    | null;
};

export type CustomNotificationType = 'orange-dao';

export type CustomNotification = (NotificationBase & {
  group: 'custom';
  pageTitle: string;
}) & {
  type: 'orange-dao';
  content: {
    pageId: string;
  };
};

export type VoteNotificationType = 'new_vote';

export type VoteNotification = NotificationBase & {
  status: VoteStatus;
  pagePath: string;
  pageTitle: string;
  pageType: 'page' | 'post';
  categoryId: string | null;
  type: VoteNotificationType;
  title: string;
  userChoice: string[] | null;
  deadline: Date;
  voteId: string;
  group: 'vote';
};

export type BountyNotificationType = (typeof bountyNotificationTypes)[number];

export type BountyNotification = NotificationBase & {
  status: BountyStatus;
  pageId: string;
  pagePath: string;
  pageTitle: string;
  applicationId: string | null;
  type: BountyNotificationType;
  group: 'bounty';
} & (
    | {
        type: Exclude<BountyNotificationType, 'suggestion.created'>;
        applicationId: string;
      }
    | {
        type: 'suggestion.created';
      }
  );

export type NotificationsGroup<T> = {
  marked: T[];
  unmarked: T[];
};

export type CreateEventPayload = {
  scope: WebhookEventNames.CardPersonPropertyAssigned;
  cardId: string;
  cardProperty: CardPropertyEntity;
};

export type NotificationType =
  | BountyNotificationType
  | CardNotificationType
  | DocumentNotificationType
  | PostNotificationType
  | ProposalNotificationType
  | VoteNotificationType
  | CustomNotificationType;

export type Notification =
  | DocumentNotification
  | CardNotification
  | PostNotification
  | ProposalNotification
  | VoteNotification
  | BountyNotification
  | CustomNotification;
