import { prisma } from 'db';
import { IPageWithPermissions, PageNotFoundError } from 'lib/pages/server';
import { replaceIllegalPermissions } from '../actions';

/**
 * When updating the position of a page within the space page tree, call this function immediately afterwards
 *
 * @abstract This function used to implement alot more. It has been left as a wrapper around the newly provided replaceIllegalPermissions to keep the codebase clean, and allow for additional changes to behaviour in future
 */
export async function setupPermissionsAfterPageRepositioned (pageId: string | IPageWithPermissions): Promise<IPageWithPermissions> {
  const page = typeof pageId === 'string' ? await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true
    }
  }) : pageId;

  if (!page) {
    throw new PageNotFoundError(pageId as string);
  }

  return replaceIllegalPermissions({ pageId: page.id });

}
