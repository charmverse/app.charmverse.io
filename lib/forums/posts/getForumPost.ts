import { prisma } from 'db';

import type { ForumPostPage } from './interfaces';

export function getForumPost(postId: string): Promise<ForumPostPage | null> {
  return prisma.page.findFirst({
    where: { id: postId, type: 'post' },
    include: { post: true }
  }) as Promise<ForumPostPage>;
}
