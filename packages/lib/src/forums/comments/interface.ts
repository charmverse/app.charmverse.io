import type { PostComment } from '@charmverse/core/prisma';

// import type { PageContent } from 'lib/prosemirror/interfaces';

export type PostCommentWithVote = PostComment & {
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
};

export type PostCommentWithVoteAndChildren = PostCommentWithVote & {
  children: PostCommentWithVoteAndChildren[];
};

export type CreatePostCommentInput = {
  content: any;
  contentText: string;
  parentId?: string;
};

export type UpdatePostCommentInput = {
  content: any;
  contentText: string;
};

export type PostCommentVote = { upvotes: number; downvotes: number; upvoted: boolean | null };
