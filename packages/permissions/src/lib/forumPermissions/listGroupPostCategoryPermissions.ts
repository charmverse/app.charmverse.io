import type { PostCategoryPermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import type { AssignablePermissionGroups, AssignedPostCategoryPermission } from '@packages/core/permissions';

import { permissionGroupIsValid } from 'lib/corePermissions';

import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

export async function listGroupPostCategoryPermissions({
  id,
  group
}: {
  id: string;
  group: AssignablePermissionGroups;
}): Promise<AssignedPostCategoryPermission[]> {
  if (!id || !permissionGroupIsValid(group)) {
    throw new InvalidInputError('Please verify your input for requesting computation of space permissions.');
  }

  let permissions: PostCategoryPermission[] = [];

  if (group === 'space') {
    permissions = await prisma.postCategoryPermission.findMany({
      where: {
        spaceId: id
      }
    });
  } else if (group === 'role') {
    permissions = await prisma.postCategoryPermission.findMany({
      where: {
        roleId: id
      }
    });
  } else {
    log.warn('listGroupPostCategoryPermissions: invalid input', { id, group });
  }

  const mappedPermissions = permissions.map(mapPostCategoryPermissionToAssignee);

  return mappedPermissions;
}
