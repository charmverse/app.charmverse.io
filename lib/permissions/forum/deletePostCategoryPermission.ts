import { prisma } from 'db';
import { UndesirableOperationError } from 'lib/utilities/errors';

type PermissionToDelete = {
  permissionId: string;
};

export async function deletePostCategoryPermission({ permissionId }: PermissionToDelete) {
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

  return prisma.postCategoryPermission.delete({
    where: {
      id: permissionId
    }
  });
}
