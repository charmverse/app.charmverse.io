import type { Page, PageUpDownVote } from '@prisma/client';

import { extractSummary } from 'lib/prosemirror/extractSummary';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumPostMeta, ForumVotes } from './interfaces';

type PageData = Pick<Page, 'id' | 'title' | 'content' | 'createdAt' | 'createdBy' | 'updatedAt'>;

type UpDownVoteData = Pick<PageUpDownVote, 'createdBy' | 'upvoted'>;

export type PageWithRelations = PageData & {
  post: { categoryId: string };
  upDownVotes: UpDownVoteData[];
};

export function getPostVoteSummary(upDownVotes: UpDownVoteData[], userId: string): ForumVotes {
  const userVote = upDownVotes.find((vote) => vote.createdBy === userId);
  return {
    downvotes: upDownVotes.filter((vote) => !vote.upvoted).length,
    upvotes: upDownVotes.filter((vote) => vote.upvoted).length,
    upvoted: userVote ? userVote.upvoted : undefined
  };
}

export function getPostMeta({ page, userId }: { page: PageWithRelations; userId: string }): ForumPostMeta {
  const { upDownVotes, post } = page;
  return {
    createdAt: page.createdAt.toString(),
    createdBy: page.createdBy,
    categoryId: post.categoryId,
    id: page.id,
    title: page.title,
    summary: extractSummary(page.content as PageContent),
    updatedAt: page.updatedAt.toString(),
    votes: getPostVoteSummary(upDownVotes, userId)
  };
}
