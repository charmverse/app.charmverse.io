import type { Prisma } from '@prisma/client';
import { BountyPermissionLevel } from '@prisma/client';

import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/middleware';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';

import { assigneeGroupIsValid } from '../validateAssigneeGroup';

import type { BountyPermissionAssignment, BountyPermissions } from './interfaces';
import { mapBountyPermissions } from './mapBountyPermissions';

export async function addBountyPermissionGroup ({
  assignee,
  level,
  resourceId
}: BountyPermissionAssignment): Promise<BountyPermissions> {

  if (BountyPermissionLevel[level] === undefined) {
    throw new InvalidInputError(`Invalid permission level: '${level}'`);
  }

  const bounty = await prisma.bounty.findUnique({
    where: {
      id: resourceId
    },
    select: {
      permissions: true,
      spaceId: true
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${resourceId} not found`);
  }

  if (assignee.group === 'public') {
    throw new InsecureOperationError('No Bounty permissions can be assigned to the public.');
  }

  // Validate assignees
  if (!assigneeGroupIsValid(assignee.group)) {
    throw new InvalidInputError(`Invalid permission assignee group: '${assignee.group}'`);
  }

  if (!assignee.id) {
    throw new InvalidInputError(`Please provide a valid ${assignee.group} id`);
  }

  if (assignee.group === 'space' && bounty.spaceId !== assignee.id) {
    throw new InsecureOperationError('You cannot assign permissions to a different space than the one the bounty belongs to.');
  }
  else if (assignee.group === 'role') {
    const role = await prisma.role.findUnique({
      where: {
        id: assignee.id
      },
      select: {
        spaceId: true
      }
    });

    if (!role) {
      throw new DataNotFoundError(`Role with id ${assignee.id} not found`);
    }
    else if (role.spaceId !== bounty.spaceId) {
      throw new InsecureOperationError('You cannot assign permissions to a different space from the one this bounty belongs to.');
    }
  }
  else if (assignee.group === 'user') {
    const { error } = await hasAccessToSpace({
      spaceId: bounty.spaceId,
      adminOnly: false,
      userId: assignee.id as string
    });

    if (error) {
      throw new InsecureOperationError('You cannot assign permissions to a user who is not a member of the space the bounty belongs to');
    }
  }

  const existingPermission = bounty.permissions.find(p => {

    if (assignee.group === 'space') {
      return p.spaceId === assignee.id && p.permissionLevel === level;
    }
    else if (assignee.group === 'role') {
      return p.roleId === assignee.id && p.permissionLevel === level;
    }
    else if (assignee.group === 'user') {
      return p.userId === assignee.id && p.permissionLevel === level;
    }
    else if (assignee.group === 'public') {
      return p.public === true && p.permissionLevel === level;
    }

    return false;
  });

  if (existingPermission) {
    return mapBountyPermissions(bounty.permissions);
  }

  const insert: Prisma.BountyPermissionCreateInput = {
    permissionLevel: level,
    bounty: {
      connect: {
        id: resourceId
      }
    },
    user: assignee.group === 'user' ? {
      connect: {
        id: assignee.id
      }
    } : undefined,
    role: assignee.group === 'role' ? {
      connect: {
        id: assignee.id
      }
    } : undefined,
    space: assignee.group === 'space' ? {
      connect: {
        id: assignee.id
      }
    } : undefined
  };

  const newPermission = await prisma.bountyPermission.create({
    data: insert,
    select: {
      bounty: {
        select: {
          permissions: true
        }
      }
    }
  });

  return mapBountyPermissions(newPermission.bounty.permissions);

}
