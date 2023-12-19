import { prisma } from '@charmverse/core/prisma-client';
import type { PostCategory, Post } from '@charmverse/core/prisma-client';

import { getSpace } from 'lib/spaces/getSpace';

export type ForumExport = { posts: Post[]; postCategories: PostCategory[] };

export async function exportForumPosts({ spaceIdOrDomain }: { spaceIdOrDomain: string }): Promise<ForumExport> {
  const space = await getSpace(spaceIdOrDomain);

  const [posts, postCategories] = await Promise.all([
    prisma.post.findMany({
      where: {
        spaceId: space.id
      }
    }),
    prisma.postCategory.findMany({
      where: {
        spaceId: space.id
      }
    })
  ]);

  return { posts, postCategories };
}
