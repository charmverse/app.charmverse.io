import type { PageType, ProposalStatus, User, VoteStatus } from '@charmverse/core/prisma';

export type NotificationGroupType = 'forum' | 'discussions' | 'votes' | 'proposals' | 'bounties';

export type NotificationActor = Pick<
  User,
  'id' | 'username' | 'path' | 'avatar' | 'avatarContract' | 'avatarTokenId' | 'avatarChain' | 'deletedAt'
>;

export type DiscussionNotificationType =
  | 'mention.created'
  | 'inline_comment.created'
  | 'inline_comment.replied'
  | 'inline_comment.mention.created'
  | 'comment.created'
  | 'comment.replied'
  | 'comment.mention.created';

interface DiscussionNotificationBase {
  taskId: string;
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pagePath: string;
  pageTitle: string;
  pageType: PageType;
  createdAt: string;
  createdBy: NotificationActor | null;
  bountyId: string | null;
  bountyTitle: string | null;
  type: DiscussionNotificationType;
  text: string;
  commentId: null | string;
  mentionId: null | string;
  inlineCommentId: null | string;
}

export type DiscussionNotification = DiscussionNotificationBase &
  (
    | {
        mentionId: string;
        type: 'mention.created';
      }
    | {
        inlineCommentId: string;
        type: 'inline_comment.created';
      }
    | {
        inlineCommentId: string;
        type: 'inline_comment.replied';
      }
    | {
        mentionId: string;
        type: 'inline_comment.mention.created';
      }
    | {
        commentId: string;
        type: 'comment.created';
      }
    | {
        commentId: string;
        type: 'comment.replied';
      }
  );

export type ForumNotificationType =
  | 'post.created'
  | 'post.comment.created'
  | 'post.comment.replied'
  | 'post.mention.created'
  | 'post.comment.mention.created';

interface ForumNotificationBase {
  taskId: string;
  spaceId: string;
  type: ForumNotificationType;
  spaceDomain: string;
  spaceName: string;
  postId: string;
  postPath: string;
  postTitle: string;
  createdAt: string;
  commentId: null | string;
  mentionId: null | string;
  commentText: string;
  createdBy: NotificationActor | null;
}

export type ForumNotification = ForumNotificationBase &
  (
    | {
        commentId: string;
        type: 'post.comment.created';
      }
    | {
        commentId: string;
        type: 'post.comment.replied';
      }
    | {
        mentionId: string;
        type: 'post.mention.created';
      }
    | {
        mentionId: string;
        commentId: string;
        type: 'post.comment.mention.created';
      }
    | {
        type: 'post.created';
      }
  );

export type ProposalNotificationType =
  | 'proposal.start_review'
  | 'proposal.start_discussion'
  | 'proposal.start_vote'
  | 'proposal.review'
  | 'proposal.discuss'
  | 'proposal.vote'
  | 'proposal.evaluation_closed';

export type ProposalNotification = {
  id: string;
  spaceDomain: string;
  spaceName: string;
  pageTitle: string;
  pagePath: string;
  status: ProposalStatus;
  pageId: string;
  taskId: string;
  type: ProposalNotificationType;
  createdAt: Date;
  createdBy?: NotificationActor | null;
};

export type VoteNotificationType = 'vote.created';

export type VoteNotification = {
  id: string;
  status: VoteStatus;
  createdBy: NotificationActor | null;
  taskId: string;
  spaceName: string;
  spaceDomain: string;
  pagePath: string | null;
  pageTitle: string | null;
  pageType: PageType | null;
  postPath: string | null;
  postTitle: string | null;
  postCategoryId: string | null;
  type: VoteNotificationType;
  title: string;
  userChoice: string[] | null;
  createdAt: string;
  deadline: Date;
};

export type NotificationsGroup<T> = {
  marked: T[];
  unmarked: T[];
};
