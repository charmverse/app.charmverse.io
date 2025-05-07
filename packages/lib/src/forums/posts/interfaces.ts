import type { Post } from '@charmverse/core/prisma';

export type ForumPostVotes = { upvotes: number; downvotes: number; upvoted: boolean | null };

export type PostWithVotes = Post & { votes: ForumPostVotes };
