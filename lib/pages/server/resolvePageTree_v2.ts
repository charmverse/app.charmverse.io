import { prisma } from 'db';
import { PageNodeWithChildren, PageNodeWithPermissions, TargetPageTree } from '../interfaces';
import { mapTargetPageTree } from '../mapPageTree';
import { PageNotFoundError } from './errors';

/**
 * Returns resolved page tree along with the permissions state
 *
 * Parents is an ordered array from closest ancestor up to the root
 * Children is a recursive array of children in tree format
 */
export async function resolvePageTreeV2 ({ pageId }: {pageId: string}):
  Promise<TargetPageTree> {

  const pageWithSpaceIdOnly = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (!pageWithSpaceIdOnly) {
    throw new PageNotFoundError(pageId);
  }

  const pagesInSpace = await prisma.page.findMany({
    where: {
      spaceId: pageWithSpaceIdOnly.spaceId
    },
    select: {
      id: true,
      parentId: true,
      index: true,
      type: true,
      createdAt: true,
      deletedAt: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const { parents, targetPage } = mapTargetPageTree<PageNodeWithPermissions, PageNodeWithChildren<PageNodeWithPermissions>>({
    items: pagesInSpace,
    targetPageId: pageId
  });

  // Prune the parent references so we have a direct chain
  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];

    parent.children = parent.children.filter(child => {

      if (i === 0) {
        return child.id === targetPage.id;
      }

      // The previous item in the parents array is the child of the current parent node
      return child.id === parents[i - 1].id;
    });
  }

  return {
    parents,
    targetPage
  };

}
