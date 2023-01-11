import type { Post } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type ForumVotes = { upvotes: number; downvotes: number; upvoted: boolean | null };
export type PostWithVotes = Post & { votes: ForumVotes };

export type ForumPostMeta = {
  createdAt: string;
  createdBy: string;
  categoryId: string;
  id: string;
  title: string;
  summary: PageContent | null;
  updatedAt: string;
  votes: ForumVotes;
  path: string;
};
