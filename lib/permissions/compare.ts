import { AllowedPagePermissions, permissionTemplates } from 'lib/permissions/pages';
import { AvailableBountyPermissions, BountyPermissionFlags, BountyPermissions, bountyPermissionMapping } from 'lib/permissions/bounties';
import { typedKeys } from 'lib/utilities/objects';
import { AssignablePermissionGroupsWithPublic, BountyPagePermissionIntersection, BountyPagePermissionIntersectionQuery } from './interfaces';
import { Permissions } from './permissions.class';

export function compareBountyPagePermissions ({
  bountyOperations, bountyPermissions, pageOperations, pagePermissions
}: BountyPagePermissionIntersectionQuery): BountyPagePermissionIntersection {

  const permissionsMap: Record<
    string,
    {bountyPermissions: AvailableBountyPermissions, pagePermissions: AllowedPagePermissions, group: AssignablePermissionGroupsWithPublic}> = {
    };

  // Populate each bounty assignee
  typedKeys(bountyPermissions).forEach(bountyPermissionLevel => {
    bountyPermissions[bountyPermissionLevel].forEach(assignee => {

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
  });

  const intersection: BountyPagePermissionIntersection = {
    hasPermissions: [],
    missingPermissions: []
  };

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
