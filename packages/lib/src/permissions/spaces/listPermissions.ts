import { prisma } from '@charmverse/core/prisma-client';
import type { AssignedPostCategoryPermission } from '@packages/core/permissions';

import { mapPostCategoryPermissionToAssignee } from '../forum/mapPostCategoryPermissionToAssignee';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import type { AssignedSpacePermission } from './mapSpacePermissionToAssignee';
import { mapSpacePermissionToAssignee } from './mapSpacePermissionToAssignee';

export type SpacePermissions = {
  space: AssignedSpacePermission[];
  forumCategories: AssignedPostCategoryPermission[];
};

export async function listPermissions({ spaceId }: { spaceId: string }): Promise<SpacePermissions> {
  const [forumCategories, space] = await Promise.all([
    prisma.postCategoryPermission
      .findMany({
        where: {
          postCategory: {
            spaceId
          }
        }
      })
      .then((permissions) => permissions.map(mapPostCategoryPermissionToAssignee)),
    prisma.spacePermission
      .findMany({
        where: {
          forSpaceId: spaceId
        }
      })
      .then((permissions) => permissions.map(mapSpacePermissionToAssignee))
  ]);

  // add default member permissions if not defined
  if (space.filter((s) => s.assignee.group === 'space').length === 0) {
    const allowedOperations = new AvailableSpacePermissions();
    space.push({
      assignee: {
        group: 'space',
        id: spaceId
      },
      operations: allowedOperations.empty
    });
  }

  return { forumCategories, space };
}
