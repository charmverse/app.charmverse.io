import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { BountyPermissions } from './interfaces';
import { mapBountyPermissions } from './mapBountyPermissions';

/**
 * Returns all existing permissions for a bounty, mapped to their level
 */
export async function queryBountyPermissions ({ bountyId }: {bountyId: string}): Promise<BountyPermissions> {

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    select: {
      id: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found.`);
  }

  const permissions = await prisma.bountyPermission.findMany({
    where: {
      bountyId
    }
  });

  return mapBountyPermissions(permissions);
}
