import type { BountyStatus, PageType, ProposalStatus, User, VoteStatus } from '@charmverse/core/prisma-client';

import type { CardPropertyEntity, WebhookEventNames } from 'lib/webhookPublisher/interfaces';

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

export type BlockCommentNotification =
  | {
      type: 'block_comment.created';
      blockCommentId: string;
    }
  | {
      type: 'block_comment.replied';
      blockCommentId: string;
    }
  | {
      type: 'block_comment.mention.created';
      mentionId: string;
      blockCommentId: string;
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
export type BlockCommentNotificationType = BlockCommentNotification['type'];

interface NotificationBase {
  taskId: string;
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  createdAt: string;
  createdBy: NotificationActor;
}

export type DiscussionNotificationType =
  | InlineCommentNotificationType
  | MentionNotificationType
  | BlockCommentNotificationType
  | 'person_assigned';

interface DiscussionNotificationBase extends NotificationBase {
  pageId: string;
  pagePath: string;
  pageTitle: string;
  type: DiscussionNotificationType;
  text: string;
  mentionId: null | string;
  inlineCommentId: null | string;
  blockCommentId: null | string;
  pageType: PageType;
  personPropertyId: null | string;
}

export type DiscussionNotification = DiscussionNotificationBase &
  (
    | MentionNotification
    | InlineCommentNotification
    | BlockCommentNotification
    | {
        type: 'person_assigned';
        personPropertyId: string;
      }
  );

export type ForumNotificationType = CommentNotificationType | MentionNotificationType | 'created';

interface ForumNotificationBase extends NotificationBase {
  type: ForumNotificationType;
  postId: string;
  postPath: string;
  postTitle: string;
  commentId: null | string;
  mentionId: null | string;
  commentText: string;
}

export type ForumNotification = ForumNotificationBase &
  (
    | CommentNotification
    | MentionNotification
    | {
        type: 'created';
      }
  );

export type ProposalNotificationType =
  | CommentNotificationType
  | MentionNotificationType
  | InlineCommentNotificationType
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
  commentId: string | null;
  inlineCommentId: string | null;
  mentionId: string | null;
} & (
    | CommentNotification
    | MentionNotification
    | InlineCommentNotification
    | {
        type: Exclude<
          ProposalNotificationType,
          CommentNotificationType | MentionNotificationType | InlineCommentNotificationType
        >;
      }
  );

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
  | MentionNotificationType
  | InlineCommentNotificationType
  | 'application.pending'
  | 'application.accepted'
  | 'application.rejected'
  | 'application.submitted'
  | 'application.approved'
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
  inlineCommentId: string | null;
  mentionId: string | null;
} & (
    | MentionNotification
    | InlineCommentNotification
    | {
        type: Exclude<BountyNotificationType, MentionNotificationType | InlineCommentNotificationType>;
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
