import type { PageComment, User } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type PageCommentWithVote = PageComment & {
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
};

export type PageCommentWithVoteAndChildren = PageCommentWithVote & {
  children: PageCommentWithVoteAndChildren[];
};

export type PageCommentVote = { upvotes: number; downvotes: number; upvoted: boolean | null };
