import type { BountyPermission, Prisma } from '@prisma/client';
import { BountyPermissionLevel } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

import { assigneeGroupIsValid } from '../validateAssigneeGroup';

import type { BountyPermissionAssignment, BountyPermissions } from './interfaces';
import { mapBountyPermissions } from './mapBountyPermissions';

/**
 * Returns true if the operation had an effect, false if nothing changed
 * @param param0
 * @returns
 */
export async function removeBountyPermissionGroup ({ assignee, level, resourceId }: BountyPermissionAssignment): Promise<BountyPermissions> {

  if (!assigneeGroupIsValid(assignee.group)) {
    throw new InvalidInputError(`Invalid permission assignee group: '${assignee.group}'`);
  }

  if (assignee.group !== 'public' && !assignee.id) {
    throw new InvalidInputError('Invalid permission assignee id');
  }

  if (!BountyPermissionLevel[level]) {
    throw new InvalidInputError(`Invalid bounty permission level: '${level}'`);
  }

  const repeatedQueryInput: Pick<BountyPermission, 'bountyId' | 'permissionLevel'> = {
    bountyId: resourceId,
    permissionLevel: level
  };

  const query: Prisma.BountyPermissionWhereUniqueInput = {
    public_bountyId_permissionLevel: assignee.group === 'public' ? {
      public: true,
      ...repeatedQueryInput
    } : undefined,
    roleId_bountyId_permissionLevel: assignee.group === 'role' ? {
      roleId: assignee.id as string,
      ...repeatedQueryInput
    } : undefined,
    userId_bountyId_permissionLevel: assignee.group === 'user' ? {
      userId: assignee.id as string,
      ...repeatedQueryInput
    } : undefined,
    spaceId_bountyId_permissionLevel: assignee.group === 'space' ? {
      spaceId: assignee.id as string,
      ...repeatedQueryInput
    } : undefined
  };

  try {
    await prisma.bountyPermission.delete({
      where: query
    });
  }
  catch {
    // Prisma will throw an error if there is nothing to delete. Catch it here so we can continue
  }

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: resourceId
    },
    select: {
      permissions: true
    }
  }) as { permissions: BountyPermission[] };

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${resourceId} not found`);
  }

  return mapBountyPermissions(bounty.permissions);

}
