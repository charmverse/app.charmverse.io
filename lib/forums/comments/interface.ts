import type { PageComment } from '@prisma/client';

import type { PageContent } from 'models';

export type PostCommentWithVote = PageComment & {
  user: {
    id: string;
    avatar: string | null;
    username: string;
  };
  upvotes: number;
  downvotes: number;
  upvoted: null | boolean;
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
