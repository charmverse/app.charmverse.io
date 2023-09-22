import type { User } from '@charmverse/core/prisma';

export type NotificationGroupType = 'forum' | 'discussions' | 'votes' | 'proposals' | 'bounties';

export type TaskUser = Pick<User, 'id' | 'username' | 'path' | 'avatar' | 'avatarTokenId'>;

export type DiscussionNotificationType =
  | 'mention.created'
  | 'inline_comment.created'
  | 'inline_comment.replied'
  | 'inline_comment.mention.created'
  | 'comment.created'
  | 'comment.replied';

interface DiscussionNotificationBase {
  taskId: string;
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pagePath: string;
  pageTitle: string;
  type: 'bounty' | 'page';
  createdAt: string;
  createdBy: TaskUser | null;
  bountyId: string | null;
  bountyTitle: string | null;
  taskType: DiscussionNotificationType;
  text: string;
  commentId: null | string;
  mentionId: null | string;
  inlineCommentId: null | string;
}

export type DiscussionNotification = DiscussionNotificationBase &
  (
    | {
        mentionId: string;
        taskType: 'mention.created';
      }
    | {
        inlineCommentId: string;
        taskType: 'inline_comment.created';
      }
    | {
        inlineCommentId: string;
        taskType: 'inline_comment.replied';
      }
    | {
        mentionId: string;
        taskType: 'inline_comment.mention.created';
      }
    | {
        commentId: string;
        taskType: 'comment.created';
      }
    | {
        commentId: string;
        taskType: 'comment.replied';
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
  taskType: ForumNotificationType;
  spaceDomain: string;
  spaceName: string;
  postId: string;
  postPath: string;
  postTitle: string;
  createdAt: string;
  commentId: null | string;
  mentionId: null | string;
  commentText: string;
  createdBy: TaskUser | null;
}

export type ForumNotification = ForumNotificationBase &
  (
    | {
        commentId: string;
        taskType: 'post.comment.created';
      }
    | {
        commentId: string;
        taskType: 'post.comment.replied';
      }
    | {
        mentionId: string;
        taskType: 'post.mention.created';
      }
    | {
        mentionId: string;
        commentId: string;
        taskType: 'post.comment.mention.created';
      }
    | {
        taskType: 'post.created';
      }
  );

export type NotificationsGroup<T> = {
  marked: T[];
  unmarked: T[];
};
