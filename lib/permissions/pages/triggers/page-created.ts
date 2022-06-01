import { getPage, IPageWithPermissions, PageNotFoundError } from 'lib/pages/server';
import { prisma } from 'db';
import { Space } from '@prisma/client';
import { upsertPermission } from '../actions/upsert-permission';

export async function setupPermissionsAfterPageCreated (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // This is a root page, so we can go ahead
  if (!page.parentId) {
    // Space id could be null
    if (page.spaceId) {
      const space = await prisma.space.findUnique({
        where: {
          id: page.spaceId
        },
        select: {
          defaultPagePermissionGroup: true
        }
      }) as Space;
      if (space?.defaultPagePermissionGroup) {
        await upsertPermission(pageId, {
          permissionLevel: space.defaultPagePermissionGroup,
          spaceId: page.spaceId
        });
      }
      else {
        await upsertPermission(
          pageId,
          {
            permissionLevel: 'full_access',
            spaceId: page.spaceId
          }
        );
      }
    }
    else {
      await upsertPermission(
        pageId,
        {
          permissionLevel: 'full_access',
          spaceId: page.spaceId
        }
      );
    }
  }
  else {
    const parent = (await getPage(page.parentId) as IPageWithPermissions);
    await Promise.all(parent.permissions.map(permission => {
      return upsertPermission(page.id, permission.id);
    }));
  }

  const pageWithPermissions = await getPage(page.id) as IPageWithPermissions;

  return pageWithPermissions;
}
