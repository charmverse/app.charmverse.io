import type { Prisma } from '@prisma/client';
import { BountyPermissionLevel } from '@prisma/client';

import { prisma } from 'db';
import { getBountyOrThrow } from 'lib/bounties/getBounty';
import { InvalidInputError } from 'lib/utilities/errors';

import { typedKeys } from '../../utilities/objects';
import type { TargetPermissionGroup } from '../interfaces';

import { addBountyPermissionGroup } from './addBountyPermissionGroup';
import type {
  BountyPermissionAssignment,
  BountyPermissionGroup,
  BountyPermissions,
  BountyReviewer,
  BountySubmitter,
  BulkBountyPermissionAssignment
} from './interfaces';
import { queryBountyPermissions } from './queryBountyPermissions';
import { removeBountyPermissionGroup } from './removeBountyPermissionGroup';

/**
 * Will reset all permissions for a bounty to target state. Existing permissions not included here will be deleted
 * Optimised to only do necessary add / substract operations
 * @param set
 */
export async function setBountyPermissions({
  bountyId,
  permissionsToAssign
}: BulkBountyPermissionAssignment): Promise<BountyPermissions> {
  if (!bountyId) {
    throw new InvalidInputError(`Please provide a valid bounty id`);
  }

  const bounty = await getBountyOrThrow(bountyId);

  const toAssign: Omit<BountyPermissionAssignment, 'resourceId'>[] =
    permissionsToAssign instanceof Array
      ? permissionsToAssign
      : // Convert mapping to list
        typedKeys(permissionsToAssign).reduce((generatedAssignments, level) => {
          generatedAssignments.push(
            ...(permissionsToAssign[level] ?? []).map((assignment) => {
              return {
                assignee: assignment,
                level
              } as Omit<BountyPermissionAssignment, 'resourceId'>;
            })
          );

          return generatedAssignments;
        }, [] as Omit<BountyPermissionAssignment, 'resourceId'>[]);

  // If there are no submitters (which means we didn't select roles to submit) then the space should be allowed to submit
  if (!toAssign.some((assignment) => assignment.level === 'submitter')) {
    toAssign.push({
      level: 'submitter',
      assignee: {
        group: 'space',
        id: bounty.spaceId
      }
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.bountyPermission.deleteMany({
      where: {
        bountyId
      }
    });
    await tx.bountyPermission.createMany({
      data: toAssign.map((assignment) => {
        const input: Prisma.BountyPermissionCreateManyInput = {
          permissionLevel: assignment.level,
          bountyId,
          public: assignment.assignee.group === 'public' ? true : undefined,
          userId: assignment.assignee.group === 'user' ? assignment.assignee.id : undefined,
          roleId: assignment.assignee.group === 'role' ? assignment.assignee.id : undefined,
          spaceId: assignment.assignee.group === 'space' ? assignment.assignee.id : undefined
        };
        return input;
      })
    });
  });

  return queryBountyPermissions({ bountyId });
}
