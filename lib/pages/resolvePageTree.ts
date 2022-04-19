import { prisma } from 'db';
import { PageNotFoundError } from './errors';
import { getPage } from './getPage';
import { IPageWithPermissions } from './interfaces';

export * from './getPage';
/**
 * Returned a flattened list of all a page's children
 * @param pageId
 */
export async function resolveChildPages (pageId: string): Promise<IPageWithPermissions []> {
  const children = await prisma.page.findMany({
    where: {
      parentId: pageId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const nestedChildren = await Promise.all(children.map(childPage => {
    return resolveChildPages(childPage.id);
  }));

  // Merge the results
  const flattenedChildren: IPageWithPermissions [] = [...children];

  nestedChildren.forEach(nestedSet => {
    flattenedChildren.push(...nestedSet);
  });

  return flattenedChildren;
}

/**
 * Returns a list of parents up to the root
 * @param pageId
 */
export async function resolveParentPages (pageId: string): Promise<IPageWithPermissions []> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  if (!page.parentId) {
    return [];
  }

  // List of parents from closest to furthest
  const parentPages: IPageWithPermissions [] = [];

  let parentPageIdToSearch = page.parentId;

  for (let i = 0; i <= parentPages.length; i++) {
    const parent = await getPage(parentPageIdToSearch) as IPageWithPermissions;

    // Gracefully handle case where a parent is referenced, but was deleted
    if (parent) {
      parentPages.push(parent);
    }

    if (parent?.parentId) {
      parentPageIdToSearch = parent.parentId;
    }

    if (!parent || !parent.parentId) {
      break;
    }

  }

  return parentPages;

}
