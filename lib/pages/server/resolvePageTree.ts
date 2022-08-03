import { prisma } from 'db';
import { PageNodeWithPermissions, TargetPageTree, TargetPageTreeWithFlatChildren } from '../interfaces';
import { mapTargetPageTree, flattenTree } from '../mapPageTree';
import { PageNotFoundError } from './errors';

/**
 * Returns resolved page tree along with the permissions state
 *
 * Parents is an ordered array from closest ancestor up to the root
 * Children is a recursive array of children in tree format
 *
 * Pass flatten children prop to also receive a flat array of children
 */
export async function resolvePageTree ({ pageId, flattenChildren }:
  {pageId: string, flattenChildren?: undefined | false}): Promise<TargetPageTree<PageNodeWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren }:
    {pageId: string, flattenChildren: true}): Promise<TargetPageTreeWithFlatChildren<PageNodeWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren = false }:
  {pageId: string, flattenChildren?: boolean}):
  Promise<TargetPageTree<PageNodeWithPermissions> | TargetPageTreeWithFlatChildren<PageNodeWithPermissions>> {

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
      spaceId: pageWithSpaceIdOnly.spaceId,
      deletedAt: null
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

  const { parents, targetPage } = mapTargetPageTree<PageNodeWithPermissions>({
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
    targetPage,
    flatChildren: flattenChildren ? flattenTree(targetPage) : undefined
  };

}
