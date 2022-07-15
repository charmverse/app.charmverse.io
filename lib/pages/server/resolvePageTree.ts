import { prisma } from 'db';
import { PageNotFoundError } from './errors';
import { getPage } from './getPage';
import { IPageWithPermissions, PageWithChildren } from '../interfaces';

/**
 * Returned a flattened list of all a page's children
 * @param pageId
 */
export async function resolveChildPagesAsFlatList (pageId: string): Promise<IPageWithPermissions []> {
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
    return resolveChildPagesAsFlatList(childPage.id);
  }));

  // Merge the results
  const flattenedChildren: IPageWithPermissions [] = [...children];

  nestedChildren.forEach(nestedSet => {
    flattenedChildren.push(...nestedSet);
  });

  return flattenedChildren;
}

/**
 * Returned the children of a specific page along with their own descendants
 * @param directOnly stops at the direct descendants of the target page
 */
export async function resolveChildPages (pageId: string, directOnly: boolean): Promise<PageWithChildren []> {

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

  if (directOnly || children.length === 0) {
    return children.map(child => {
      return {
        ...child,
        children: []
      };
    });
  }

  const childrenWithNestedChildren: PageWithChildren [] = await Promise.all(children.map(childPage => {
    return new Promise<PageWithChildren>((resolve, reject) => {
      resolveChildPages(childPage.id, false)
        .then(nestedChildren => {
          resolve({
            ...childPage,
            children: nestedChildren
          });
        });
    });
  }));

  return childrenWithNestedChildren;

}

/**
 * Returns a list of parents up to the root
 * @param pageId
 */
export async function resolveParentPages (pageId: string | IPageWithPermissions): Promise<IPageWithPermissions []> {
  const page = typeof pageId === 'string' ? await getPage(pageId) : pageId;

  if (!page) {
    throw new PageNotFoundError(pageId as string);
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
