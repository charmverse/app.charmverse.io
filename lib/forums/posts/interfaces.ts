import type { Page, Post } from '@prisma/client';

import type { PageContent } from 'lib/prosemirror/interfaces';
import type { JSONValues } from 'lib/utilities/types';

type PostPage = Pick<Page, 'id' | 'title' | 'content' | 'createdAt' | 'createdBy' | 'spaceId' | 'updatedAt'>;
export type PageValues = JSONValues<PostPage>;
export type ForumVotes = { upvotes: number; downvotes: number; upvoted: boolean | null };
export type ForumPostPage = PageValues & { post: Post };
export type ForumPostPageWithVotes = PageValues & { post: Post; votes: ForumVotes };

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
