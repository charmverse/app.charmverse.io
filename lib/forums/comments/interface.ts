import type { PageComment } from '@prisma/client';

import type { PageContent } from 'models';

export type PostCommentWithVote = PageComment & { upvotes: number; downvotes: number; upvoted: null | boolean };

export type CreatePageCommentInput = {
  content: PageContent;
  contentText: string;
  parentId: string;
};
