import { BountyPermissionLevel } from '@prisma/client';

import { getBountyOrThrow } from 'lib/bounties/getBounty';

import { typedKeys } from '../../utilities/objects';

import { addBountyPermissionGroup } from './addBountyPermissionGroup';
import type { BountyPermissionAssignment, BountyPermissions, BulkBountyPermissionAssignment } from './interfaces';
import { queryBountyPermissions } from './queryBountyPermissions';
import { removeBountyPermissionGroup } from './removeBountyPermissionGroup';

/**
 * Will reset all permissions for a bounty to target state. Existing permissions not included here will be deleted
 * Optimised to only do necessary add / substract operations
 * @param set
 */
export async function setBountyPermissions ({ bountyId, permissionsToAssign }: BulkBountyPermissionAssignment): Promise<BountyPermissions> {

  await getBountyOrThrow(bountyId);

  const toAssign: Omit<BountyPermissionAssignment, 'resourceId'>[] = permissionsToAssign instanceof Array ? permissionsToAssign
  // Convert mapping to list
    : typedKeys(permissionsToAssign).reduce((generatedAssignments, level) => {
      generatedAssignments.push(...(permissionsToAssign[level] ?? []).map(assignment => {
        return {
          assignee: assignment,
          level
        } as Omit<BountyPermissionAssignment, 'resourceId'>;
      }));

      return generatedAssignments;
    }, [] as Omit<BountyPermissionAssignment, 'resourceId'>[]);

  const permissions = await queryBountyPermissions({ bountyId });

  const toDelete: BountyPermissionAssignment[] = [];

  const toAdd: BountyPermissionAssignment[] = [];

  typedKeys(BountyPermissionLevel).forEach(permissionLevel => {

    const oldAssignees = permissions?.[permissionLevel] ?? [];
    const currentAssignees = toAssign.filter(assignment => assignment.level === permissionLevel);

    const assigneesToRemove = oldAssignees.filter(assignee => {
      return currentAssignees.find(a => a.assignee.group === assignee.group && a.assignee.id === assignee.id) === undefined;
    }).map(a => {
      return {
        assignee: a,
        level: permissionLevel,
        resourceId: bountyId
      } as BountyPermissionAssignment;
    });

    toDelete.push(...assigneesToRemove);
  });

  toAssign.forEach(perm => {
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
