import type { PostComment, User } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

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

export type ForumCommentTask = {
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  postId: string;
  postPath: string;
  postTitle: string;
  createdBy: User | null;
  createdAt: string;
  commentId: string;
  commentText: string;
};

export type ForumCommentTasksGroup = {
  marked: ForumCommentTask[];
  unmarked: ForumCommentTask[];
};
