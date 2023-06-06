import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { BountyWithDetails } from 'lib/bounties';

import type { AvailableResourcesRequest } from '../permissions/interfaces';
import { DataNotFoundError } from '../utilities/errors';

export async function listAvailableBounties({ spaceId }: AvailableResourcesRequest): Promise<BountyWithDetails[]> {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      publicBountyBoard: true
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  return prisma.bounty.findMany({
    where: {
      spaceId,
      page: {
        // Prevents returning bounties from other spaces
        spaceId,
        deletedAt: null
      }
    },
    include: {
      applications: true,
      page: {
        include: {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      }
    }
  }) as Promise<BountyWithDetails[]>;
}
