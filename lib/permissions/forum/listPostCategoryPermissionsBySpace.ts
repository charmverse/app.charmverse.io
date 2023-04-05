import { prisma } from 'db';

import type { AssignedPermissionsQuery } from '../interfaces';

import type { AssignedPostCategoryPermission } from './interfaces';
import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

export type PermissionsGroupQuery = Pick<AssignedPermissionsQuery, 'id' | 'group'>;

export async function listPostCategoryPermissionsBySpace({
  spaceId
}: {
  spaceId: string;
}): Promise<AssignedPostCategoryPermission[]> {
  const permissions = await prisma.postCategoryPermission.findMany({
    where: {
      postCategory: {
        spaceId
      }
    }
  });

  return permissions.map(mapPostCategoryPermissionToAssignee);
}
