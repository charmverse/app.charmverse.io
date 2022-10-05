import { AvailableBountyPermissions, bountyPermissionMapping } from 'lib/permissions/bounties/client';
import { typedKeys } from 'lib/utilities/objects';

import type { AssignablePermissionGroupsWithPublic, BountyPagePermissionIntersection, BountyPagePermissionIntersectionQuery } from './interfaces';
import { AllowedPagePermissions } from './pages/available-page-permissions.class';
import { permissionTemplates } from './pages/page-permission-mapping';

export function compareBountyPagePermissions ({
  bountyOperations, bountyPermissions, pageOperations, pagePermissions, roleups
}: BountyPagePermissionIntersectionQuery): BountyPagePermissionIntersection {

  const permissionsMap: Record<
    string,
    { bountyPermissions: AvailableBountyPermissions, pagePermissions: AllowedPagePermissions, group: AssignablePermissionGroupsWithPublic }> = {
    };

  // Populate each bounty assignee
  typedKeys(bountyPermissions).forEach(bountyPermissionLevel => {
    bountyPermissions[bountyPermissionLevel]?.forEach(assignee => {

      const mapKey = assignee.group === 'public' ? 'public' : assignee.id as string;

      if (!permissionsMap[mapKey]) {
        permissionsMap[mapKey] = {
          group: assignee.group,
          bountyPermissions: new AvailableBountyPermissions(),
          pagePermissions: new AllowedPagePermissions()
        };
      }
      permissionsMap[mapKey].bountyPermissions.addPermissions(bountyPermissionMapping[bountyPermissionLevel].slice());
    });
  });

  pagePermissions.forEach(permission => {
    const targetGroup: AssignablePermissionGroupsWithPublic = permission.public ? 'public' : permission.spaceId ? 'space' : permission.roleId ? 'role' : 'user';
    const mapKey = targetGroup === 'public' ? 'public' : (targetGroup === 'space' ? permission.spaceId : targetGroup === 'role' ? permission.roleId : permission.userId) as string;

    if (!permissionsMap[mapKey]) {
      permissionsMap[mapKey] = {
        group: targetGroup,
        bountyPermissions: new AvailableBountyPermissions(),
        pagePermissions: new AllowedPagePermissions()
      };
    }
    permissionsMap[mapKey].pagePermissions.addPermissions(permissionTemplates[permission.permissionLevel].slice());
  });

  const intersection: BountyPagePermissionIntersection = {
    hasPermissions: [],
    missingPermissions: []
  };

  // Add role permissions to any user already in the map with this role
  roleups.forEach(roleWithMembers => {

    const rolePermissions = permissionsMap[roleWithMembers.id];

    if (rolePermissions) {
      roleWithMembers.users.forEach(u => {

        const roleUserPermissions = permissionsMap[u.id];

        roleUserPermissions?.bountyPermissions.addPermissions(rolePermissions.bountyPermissions.operationFlags);
        roleUserPermissions?.pagePermissions.addPermissions(rolePermissions.pagePermissions.operationFlags);
      });
    }
  });

  typedKeys(permissionsMap).forEach(assigneeId => {
    const { bountyPermissions: assigneeBountyPermissions, pagePermissions: assigneePagePermissions, group } = permissionsMap[assigneeId];

    const assignee = {
      group: group as Exclude<AssignablePermissionGroupsWithPublic, 'any'>,
      id: assigneeId
    };

    if (assigneeBountyPermissions.hasPermissions(bountyOperations) && assigneePagePermissions.hasPermissions(pageOperations)) {
      intersection.hasPermissions.push(assignee);
    }
    else {
      intersection.missingPermissions.push(assignee);
    }
  });

  return intersection;

}
