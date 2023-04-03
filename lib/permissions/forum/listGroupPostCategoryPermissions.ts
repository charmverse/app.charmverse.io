import type { PostCategoryPermission } from '@prisma/client';

import { prisma } from 'db';
import log from 'lib/log';
import { InvalidInputError } from 'lib/utilities/errors';

import type { AssignedPermissionsQuery } from '../interfaces';
import { permissionGroupIsValid } from '../utils';

import type { AssignedPostCategoryPermission } from './interfaces';
import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

export type PermissionsGroupQuery = Pick<AssignedPermissionsQuery, 'id' | 'group'>;

export async function listGroupPostCategoryPermissions({
  id,
  group
}: PermissionsGroupQuery): Promise<AssignedPostCategoryPermission[]> {
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
