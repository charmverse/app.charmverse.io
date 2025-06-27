import { prisma } from '@charmverse/core/prisma-client';

import type { PostResource } from './interfaces';

export function postResolver({ resourceId }: { resourceId: string }) {
  return prisma.post.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      proposalId: true,
      isDraft: true
    }
  }) as Promise<PostResource>;
}
