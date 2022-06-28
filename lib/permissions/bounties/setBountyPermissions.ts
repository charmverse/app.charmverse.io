import { prisma } from 'db';
import { getBounty } from 'lib/bounties/getBounty';
import { DataNotFoundError } from 'lib/utilities/errors';
import { flatArrayMap } from 'lib/utilities/array';
import { BountyPermissionAssignment, BountyPermissions, BulkBountyPermissionAssignment } from './interfaces';
import { queryBountyPermissions } from './queryBountyPermissions';
import { typedKeys } from '../../utilities/objects';
import { addBountyPermissionGroup } from './addBountyPermissionGroup';
import { removeBountyPermissionGroup } from './removeBountyPermissionGroup';

/**
 * Will reset all permissions for a bounty to target state. Existing permissions not included here will be deleted
 * Optimised to only do necessary add / substract operations
 * @param set
 */
export async function setBountyPermissions ({ bountyId, permissionsToAssign }: BulkBountyPermissionAssignment): Promise<BountyPermissions> {

  const bounty = await getBounty(bountyId);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const permissions = await queryBountyPermissions({ bountyId });

  const toDelete: BountyPermissionAssignment[] = [];

  const toAdd: BountyPermissionAssignment[] = [];

  typedKeys(permissions).forEach(permissionLevel => {

    const assigneesToLevel = permissions[permissionLevel];

    const missingSetters = assigneesToLevel.filter(assignee => {
      return permissionsToAssign.find(p => {
        return p.level === permissionLevel && p.assignee.group === assignee.group;
      }) === undefined;
    });
    toDelete.push(...missingSetters.map((val => {
      const deleteCommand: BountyPermissionAssignment = {
        resourceId: bountyId,
        assignee: {
          group: val.group,
          id: val.id
        },
        level: permissionLevel
      };
      return deleteCommand;
    })));
  });

  permissionsToAssign.forEach(perm => {
    const existingSamePermissionsGroups = permissions[perm.level];
    if (existingSamePermissionsGroups.find(p => p.group === perm.assignee.group && perm.assignee.id === p.id) === undefined) {
      toAdd.push({
        assignee: perm.assignee,
        level: perm.level,
        resourceId: bountyId
      });
    }
  });

  await Promise.all(toAdd.map(assignment => {
    return addBountyPermissionGroup(assignment);
  }));

  await Promise.all(toDelete.map(assignment => {
    return removeBountyPermissionGroup(assignment);
  }));

  return queryBountyPermissions({ bountyId });

}
