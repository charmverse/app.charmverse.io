import type { Page, Post } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';

export type ForumVotes = { upvotes: number; downvotes: number; upvoted?: boolean };
export type ForumPostPage = Page & { post: Post };
export type ForumPostPageWithVotes = Page & { post: Post; votes: ForumVotes };

export type ForumPostMeta = {
  createdAt: string;
  createdBy: string;
  categoryId: string;
  id: string;
  title: string;
  summary: PageContent | null;
  updatedAt: string;
  votes: ForumVotes;
};
