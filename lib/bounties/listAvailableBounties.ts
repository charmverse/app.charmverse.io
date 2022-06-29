import { BountyWithDetails } from 'models';
import { prisma } from 'db';
import { getGroupsWithOperations } from '../permissions/bounties';
import { AvailableResourcesRequest } from '../permissions/interfaces';

export function listAvailableBounties ({ spaceId, userId }: AvailableResourcesRequest): Promise<BountyWithDetails> {

  const groups = getGroupsWithOperations(['view']);

  throw new Error('Not implemented');
  /*
  return prisma.bounty.findMany({
    where: {

      // TODO

    }
  });
  */
}
