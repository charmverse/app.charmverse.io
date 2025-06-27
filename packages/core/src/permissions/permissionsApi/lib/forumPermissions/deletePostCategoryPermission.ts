import { prisma } from '@charmverse/core/prisma-client';
import { UndesirableOperationError } from '@packages/core/errors';
import type { PermissionResource } from '@packages/core/permissions';

export async function deletePostCategoryPermission({ permissionId }: PermissionResource): Promise<void> {
  const permission = await prisma.postCategoryPermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!permission) {
    return;
  }

  if (permission?.permissionLevel === 'category_admin' || permission?.permissionLevel === 'moderator') {
    throw new UndesirableOperationError(`Cannot delete individual ${permission.permissionLevel} permission`);
  }

  await prisma.postCategoryPermission.delete({
    where: {
      id: permissionId
    }
  });
}
