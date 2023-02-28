import type { PostComment, User } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type TaskUser = Pick<User, 'id' | 'username' | 'path' | 'avatar' | 'avatarTokenId'>;

export type PostCommentWithVote = PostComment & {
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
};

export type PostCommentWithVoteAndChildren = PostCommentWithVote & {
  children: PostCommentWithVoteAndChildren[];
};

export type CreatePostCommentInput = {
  content: PageContent;
  contentText: string;
  parentId?: string;
};

export type UpdatePostCommentInput = {
  content: PageContent;
  contentText: string;
};

export type PostCommentVote = { upvotes: number; downvotes: number; upvoted: boolean | null };

export type ForumTask = {
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  postId: string;
  postPath: string;
  postTitle: string;
  createdAt: string;
  commentId: string | null;
  mentionId: string | null;
  commentText: string;
  createdBy: TaskUser | null;
};

export type ForumTasksGroup = {
  marked: ForumTask[];
  unmarked: ForumTask[];
};
