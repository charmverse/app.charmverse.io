import type { Post } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type ForumVotes = { upvotes: number; downvotes: number; upvoted: boolean | null };
export type PostWithVotes = Post & { votes: ForumVotes };

export type ForumPostMeta = Pick<Post, 'createdBy' | 'id' | 'categoryId' | 'title' | 'path'> & {
  summary: PageContent | null;
  votes: ForumVotes;
  createdAt: string;
  updatedAt: string;
};
