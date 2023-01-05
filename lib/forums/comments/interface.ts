import type { PageComment, User } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type PostCommentWithVote = PageComment & {
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
  parentId: string;
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
  pageId: string;
  pagePath: string;
  pageTitle: string;
  createdBy: User | null;
  createdAt: string;
  commentId: string;
  commentText: string;
};

export type ForumCommentTasksGroup = {
  marked: ForumCommentTask[];
  unmarked: ForumCommentTask[];
};
