import { getPage, IPageWithPermissions } from 'lib/pages';
import { prisma } from 'db';
import { createPagePermission } from '../page-permission-actions';
import { IPagePermissionWithSource } from '../page-permission-interfaces';
import { PermissionNotFoundError } from '../errors';

/**
 * Sync permissions with the parent
 */
export async function setupPermissionsAfterPagePermissionUpdated (permissionId: string): Promise<IPagePermissionWithSource> {

  const permission = await prisma.pagePermission.findUnique({
    where: {
      id: permissionId
    },
    include: {
      sourcePermission: true
    }
  });

  if (permission !== null) {
    const page = await getPage(permission.pageId);

    if (page?.parentId) {
      const parentPage = await getPage(page.parentId);

      if (!parentPage) {
        return permission;
      }

      const existingMatchingPermission = parentPage?.permissions.find(parentPermission => {
        return parentPermission.permissionLevel === permission.permissionLevel && (
          (parentPermission.userId && parentPermission.userId === permission.userId) || (
            parentPermission.roleId && parentPermission.roleId === permission.roleId
          ) || (
            parentPermission.spaceId && parentPermission.spaceId === permission.spaceId
          )
        );
      });

      if (existingMatchingPermission) {
        const updatedPermission = await createPagePermission({
          pageId: page.id,
          inheritedFromPermission: existingMatchingPermission.inheritedFromPermission ?? existingMatchingPermission.id
        });

        return updatedPermission;
      }
      else {
        return permission;
      }

    }
    else {
      return permission;
    }
  }
  else {
    throw new PermissionNotFoundError(permissionId);
  }

}
