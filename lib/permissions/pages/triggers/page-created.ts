import { prisma } from 'db';
import { PageNotFoundError } from 'lib/public-api';
import { getPage, IPageWithPermissions } from '../../../pages';

import { createPagePermission, inheritPermissions } from '../page-permission-actions';

export async function setupPermissionsAfterPageCreated (pageId: string): Promise<IPageWithPermissions> {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // This is a root page, so we can go ahead
  if (!page.parentId) {
    await createPagePermission({
      pageId: page.id,
      permissionLevel: 'full_access',
      spaceId: page.spaceId
    });
  }
  else {
    await inheritPermissions(page.parentId, page.id);
  }

  const pageWithPermissions = await getPage(page.id) as IPageWithPermissions;

  return pageWithPermissions;
}
