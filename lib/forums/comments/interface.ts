import type { PageComment } from '@prisma/client';

import type { PageContent } from 'models';

export type PostCommentWithVote = PageComment & { upvotes: number; downvotes: number; upvoted: null | boolean };

export type CreatePostCommentInput = {
  content: PageContent;
  contentText: string;
  parentId: string | null;
};

export type UpdatePostCommentInput = {
  content: PageContent;
  contentText: string;
};
