import { prisma } from 'db';
import { MissingDataError } from 'lib/utilities/errors';
import { PageNode, PageNodeWithChildren, PageNodeWithPermissions } from '../interfaces';
import { PageNotFoundError } from './errors';
import { mapPageTree } from '../mapPageTree';

/**
 * Returns resolved page tree along with the permissions state
 *
 * Parents is an ordered array from closest ancestor up to the root
 * Children is a recursive array of children in tree format
 */
export async function resolvePageTreeV2 ({ pageId }: {pageId: string}):
  Promise<{parents: PageNode [], pageWithChildren: PageNode}> {

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

  const [prunedRoot, targetNode] = mapPageTree<PageNodeWithPermissions, PageNodeWithChildren<PageNodeWithPermissions>>({
    items: pagesInSpace,
    targetPageId: pageId
  });

  const parents: PageNode[] = [];

  function populateParents (currentNode: PageNodeWithChildren<PageNodeWithPermissions>): void {
    if (currentNode.id === pageId) {
      return;
    }

    parents.push(currentNode);

    // Depends on map page tree to prune all non related parents
    const child = currentNode.children?.[0];

    if (!child) {
      throw new MissingDataError('Tree traversal failed. Page could not be found');
    }

    return populateParents(child);
  }

  populateParents(prunedRoot);

  return {
    parents: parents.reverse(),
    pageWithChildren: targetNode
  };

}
