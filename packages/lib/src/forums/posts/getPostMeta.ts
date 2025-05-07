import type { Post, PostUpDownVote } from '@charmverse/core/prisma';
import { extractSummary } from 'lib/prosemirror/extractSummary';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumPostVotes } from './interfaces';

type UpDownVoteData = Pick<PostUpDownVote, 'createdBy' | 'upvoted'>;

export type PostWithRelations = Post & {
  upDownVotes: UpDownVoteData[];
};
export type ForumVotes = { upvotes: number; downvotes: number; upvoted: boolean | null };

export type ForumPostMeta = Pick<
  Post,
  'content' | 'contentText' | 'createdBy' | 'id' | 'categoryId' | 'title' | 'path'
> & {
  summary: PageContent | null;
  votes: ForumPostVotes;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
};

export function getPostVoteSummary(upDownVotes: UpDownVoteData[], userId?: string): ForumVotes {
  const userVote = userId ? upDownVotes.find((vote) => vote.createdBy === userId) : undefined;
  return {
    downvotes: upDownVotes.filter((vote) => !vote.upvoted).length,
    upvotes: upDownVotes.filter((vote) => vote.upvoted).length,
    upvoted: userVote ? userVote.upvoted : null
  };
}

type PostMetaToGet = {
  post: PostWithRelations;
  userId?: string;
};

export function getPostMeta({ post, userId }: PostMetaToGet): ForumPostMeta {
  const { upDownVotes } = post;
  return {
    ...post,
    isDraft: post.isDraft ?? false,
    summary: extractSummary(post.content as PageContent),
    updatedAt: post.updatedAt.toString(),
    createdAt: post.createdAt.toString(),
    votes: getPostVoteSummary(upDownVotes, userId)
  };
}
