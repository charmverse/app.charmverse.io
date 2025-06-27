import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import type { AssignedPagePermission, Resource } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { mapPagePermissionToAssignee } from './utilities/mapPagePermissionToAssignee';

export async function listPagePermissions({ resourceId }: Resource): Promise<AssignedPagePermission[]> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Valid resource ID for a page is required`);
  }

  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId: resourceId
    },
    include: {
      sourcePermission: true
    }
  });

  return permissions.map((p) => mapPagePermissionToAssignee({ permission: p }));
}
