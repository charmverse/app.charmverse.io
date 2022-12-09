import { prisma } from 'db';

import type { ForumPostPageWithoutVote } from './interfaces';

export function getForumPost(postId: string): Promise<ForumPostPageWithoutVote | null> {
  return prisma.page.findFirst({
    where: { id: postId, type: 'post' },
    include: { post: true }
  }) as Promise<ForumPostPageWithoutVote>;
}
