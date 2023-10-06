import type { BountyStatus, PageType, ProposalStatus, User, VoteStatus } from '@charmverse/core/prisma-client';

import type { CardPropertyEntity, WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import type { notificationGroups } from './constants';

export type NotificationGroup = (typeof notificationGroups)[number];
export type NotificationGroupType = 'forum' | 'discussions' | 'votes' | 'proposals' | 'bounties';

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

export type MentionNotification = {
  type: 'mention.created';
  mentionId: string;
};

export type CommentNotificationType = CommentNotification['type'];
export type InlineCommentNotificationType = InlineCommentNotification['type'];
export type MentionNotificationType = MentionNotification['type'];

interface NotificationBase {
  taskId: string;
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  createdAt: string;
  createdBy: NotificationActor;
}

export type CardNotification = NotificationBase & {
  pageId: string;
  pagePath: string;
  pageTitle: string;
  type: 'person_assigned';
  text: string;
  personPropertyId: string;
};

export type CardNotificationType = CardNotification['type'];

interface DocumentNotificationBase extends NotificationBase {
  pageId: string;
  pagePath: string;
  pageTitle: string;
  type: InlineCommentNotificationType | MentionNotificationType | CommentNotificationType;
  text: string;
  mentionId: null | string;
  inlineCommentId: null | string;
  commentId: null | string;
  pageType: PageType | 'post';
}

export type DocumentNotification = DocumentNotificationBase &
  (CommentNotification | MentionNotification | InlineCommentNotification);

export type DocumentNotificationType = DocumentNotification['type'];

export type DiscussionNotification = CardNotification | DocumentNotification;

export type PostNotificationType = 'created';

export interface ForumNotification extends NotificationBase {
  type: PostNotificationType;
  postId: string;
  postPath: string;
  postTitle: string;
}

export type ProposalNotificationType =
  | 'start_review'
  | 'start_discussion'
  | 'reviewed'
  | 'needs_review'
  | 'vote'
  | 'evaluation_active'
  | 'evaluation_closed';

export type ProposalNotification = NotificationBase & {
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
  pageId: string;
  type: ProposalNotificationType;
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
};

export type BountyNotificationType =
  | 'application.created'
  | 'application.approved'
  | 'application.rejected'
  | 'submission.created'
  | 'submission.approved'
  | 'application.payment_pending'
  | 'application.payment_completed'
  | 'suggestion.created';

export type BountyNotification = NotificationBase & {
  status: BountyStatus;
  pageId: string;
  pagePath: string;
  pageTitle: string;
  applicationId: string | null;
  type: BountyNotificationType;
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

export type NotificationType = ProposalNotificationType | ForumNotificationType | DiscussionNotificationType;
