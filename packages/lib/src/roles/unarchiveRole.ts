import { prisma } from '@charmverse/core/prisma-client';
import { getMaxRolesCount } from '@packages/lib/roles/getMaxRolesCount';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';

interface UnarchiveRoleInput {
  roleId: string;
  userId: string;
}

export async function unarchiveRole({ roleId, userId }: UnarchiveRoleInput) {
  const role = await prisma.role.findUnique({
    where: {
      id: roleId
    },
    select: {
      id: true,
      spaceId: true,
      archived: true,
      source: true
    }
  });

  if (!role) {
    throw new DataNotFoundError(`Role with id ${roleId} not found`);
  }

  if (!role.archived) {
    throw new InvalidInputError('Role is not archived');
  }

  // Don't allow unarchiving roles from external sources
  if (role.source === 'guild_xyz' || role.source === 'summon') {
    throw new UndesirableOperationError('Cannot unarchive roles managed by external sources');
  }

  // Get space details to check tier
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: role.spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

  // Get current active roles count
  const activeRolesCount = await prisma.role.count({
    where: {
      spaceId: role.spaceId,
      archived: false
    }
  });

  // Get max roles allowed for this tier
  const maxRoles = getMaxRolesCount(space.subscriptionTier);

  // Check if unarchiving would exceed the limit
  if (activeRolesCount >= maxRoles) {
    throw new UndesirableOperationError(
      `Cannot unarchive role. You have reached the maximum number of roles (${maxRoles}) for your plan.`
    );
  }

  const updatedRole = await prisma.role.update({
    where: {
      id: roleId
    },
    data: {
      archived: false
    }
  });

  return updatedRole;
}
