import type { Post, PostUpDownVote } from '@prisma/client';

import { extractSummary } from 'lib/prosemirror/extractSummary';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ForumPostMeta, ForumVotes } from './interfaces';

type UpDownVoteData = Pick<PostUpDownVote, 'createdBy' | 'upvoted'>;

export type PostWithRelations = Post & {
  upDownVotes: UpDownVoteData[];
};

export function getPostVoteSummary(upDownVotes: UpDownVoteData[], userId?: string): ForumVotes {
  const userVote = userId ? upDownVotes.find((vote) => vote.createdBy === userId) : undefined;
  return {
    downvotes: upDownVotes.filter((vote) => !vote.upvoted).length,
    upvotes: upDownVotes.filter((vote) => vote.upvoted).length,
    upvoted: userVote ? userVote.upvoted : false
  };
}

type PostMetaToGet = {
  post: PostWithRelations;
  userId: string;
};

export function getPostMeta({ post, userId }: PostMetaToGet): ForumPostMeta {
  const { upDownVotes } = post;
  return {
    ...post,
    summary: extractSummary(post.content as PageContent),
    updatedAt: post.updatedAt.toString(),
    createdAt: post.createdAt.toString(),
    votes: getPostVoteSummary(upDownVotes, userId)
  };
}
