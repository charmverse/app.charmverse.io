import type { PageComment } from '@prisma/client';

export type PostCommentWithVote = PageComment & { upvotes: number; downvotes: number; upvoted: null | boolean };
