import type { BountyOperation, PageOperations } from '@prisma/client';

import type { Member } from 'lib/members/interfaces';
import { AvailableBountyPermissions, bountyPermissionMapping } from 'lib/permissions/bounties/client';
import { typedKeys } from 'lib/utilities/objects';

import type { BountyPermissions } from './bounties';
import type { AssignablePermissionGroupsWithPublic, TargetPermissionGroup, PagePermissionMeta } from './interfaces';
import { AllowedPagePermissions } from './pages/available-page-permissions.class';
import { permissionTemplates } from './pages/page-permission-mapping';

export interface BountyPagePermissionIntersectionQuery {
  bountyOperations: BountyOperation[];
  bountyPermissions: Partial<BountyPermissions>;
  pageOperations: PageOperations[];
  pagePermissions: PagePermissionMeta[];
  members: Member[];
}

export interface BountyPagePermissionIntersection {
  hasPermissions: TargetPermissionGroup[];
  missingPermissions: TargetPermissionGroup[];
}

export function compareBountyPagePermissions({
  bountyOperations,
  bountyPermissions,
  pageOperations,
  pagePermissions,
  members
}: BountyPagePermissionIntersectionQuery): BountyPagePermissionIntersection {
  const permissionsMap: Record<
    string,
    {
      bountyPermissions: AvailableBountyPermissions;
      pagePermissions: AllowedPagePermissions;
      group: AssignablePermissionGroupsWithPublic;
    }
  > = {};

  // Populate each bounty assignee
  typedKeys(bountyPermissions).forEach((bountyPermissionLevel) => {
    bountyPermissions[bountyPermissionLevel]?.forEach((assignee) => {
      const mapKey = assignee.group === 'public' ? 'public' : assignee.id;

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

  pagePermissions.forEach((permission) => {
    const targetGroup: AssignablePermissionGroupsWithPublic = permission.public
      ? 'public'
      : permission.spaceId
      ? 'space'
      : permission.roleId
      ? 'role'
      : 'user';
    const mapKey =
      targetGroup === 'public'
        ? 'public'
        : ((targetGroup === 'space'
            ? permission.spaceId
            : targetGroup === 'role'
            ? permission.roleId
            : permission.userId) as string);

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
  members.forEach((member) => {
    const userPermissions = permissionsMap[member.id];
    if (userPermissions) {
      const userRolePermissions = member.roles.map((role) => permissionsMap[role.id]).filter(Boolean);
      userRolePermissions.forEach((rolePermissions) => {
        userPermissions.bountyPermissions.addPermissions(rolePermissions.bountyPermissions.operationFlags);
        userPermissions.pagePermissions.addPermissions(rolePermissions.pagePermissions.operationFlags);
      });
    }
  });

  typedKeys(permissionsMap).forEach((assigneeId) => {
    const {
      bountyPermissions: assigneeBountyPermissions,
      pagePermissions: assigneePagePermissions,
      group
    } = permissionsMap[assigneeId];

    const assignee = {
      group: group as Exclude<AssignablePermissionGroupsWithPublic, 'any'>,
      id: assigneeId
    };

    if (
      assigneeBountyPermissions.hasPermissions(bountyOperations) &&
      assigneePagePermissions.hasPermissions(pageOperations)
    ) {
      intersection.hasPermissions.push(assignee);
    } else {
      intersection.missingPermissions.push(assignee);
    }
  });

  return intersection;
}
