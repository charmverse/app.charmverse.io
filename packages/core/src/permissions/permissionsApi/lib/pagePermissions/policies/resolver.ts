import { prisma } from '@charmverse/core/prisma-client';

import type { PageResource } from './interfaces';

export function pageResolver({ resourceId }: { resourceId: string }) {
  return prisma.page.findUnique({
    where: {
      id: resourceId
    },
    select: {
      createdBy: true,
      id: true,
      proposalId: true,
      convertedProposalId: true,
      type: true,
      spaceId: true,
      parentId: true,
      isLocked: true,
      bounty: {
        select: {
          createdBy: true,
          status: true,
          spaceId: true
        }
      }
    }
  }) as Promise<PageResource>;
}
