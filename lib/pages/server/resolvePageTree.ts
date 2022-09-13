import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors';
import { PageNodeWithPermissions, PageTreeResolveInput, TargetPageTree, TargetPageTreeWithFlatChildren } from '../interfaces';
import { mapTargetPageTree, flattenTree } from '../mapPageTree';
import { PageNotFoundError } from './errors';

function generatePagesQuery ({ spaceId, includeDeletedPages }: {spaceId: string, includeDeletedPages?: boolean}) {
  return {
    where: {
      spaceId,
      // Soft deleted pages have a value for deletedAt. Active pages are null
      deletedAt: includeDeletedPages ? undefined : null
    },
    select: {
      id: true,
      parentId: true,
      index: true,
      type: true,
      createdAt: true,
      deletedAt: true,
      spaceId: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  };
}

/**
 * Returns resolved page tree along with the permissions state
 *
 * Parents is an ordered array from closest ancestor up to the root
 * Children is a recursive array of children in tree format
 *
 * Pass flatten children prop to also receive a flat array of children
 */
export async function resolvePageTree ({ pageId, flattenChildren, pageNodes }:
  PageTreeResolveInput & {flattenChildren?: undefined | false}): Promise<TargetPageTree<PageNodeWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren, pageNodes }:
  PageTreeResolveInput & {flattenChildren: true}): Promise<TargetPageTreeWithFlatChildren<PageNodeWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren = false, includeDeletedPages = false, pageNodes }:
  PageTreeResolveInput):
  Promise<TargetPageTree<PageNodeWithPermissions> | TargetPageTreeWithFlatChildren<PageNodeWithPermissions>> {

  const pageWithSpaceIdOnly = pageNodes ? pageNodes.find(node => node.id === pageId) : await prisma.page.findUnique({
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

  const pagesInSpace = pageNodes ?? await prisma.page.findMany(generatePagesQuery({ includeDeletedPages, spaceId: pageWithSpaceIdOnly.spaceId }));

  const { parents, targetPage } = mapTargetPageTree<PageNodeWithPermissions>({
    items: pagesInSpace,
    targetPageId: pageId,
    includeDeletedPages,
    includeProposals: true
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

export type MultiPageTreeResolveInput = Pick<PageTreeResolveInput, 'includeDeletedPages'> & {pageIds: string[]}

/**
 * Resolved page trees mapped to the page id
 */
export type MultiPageTreeResolveOutput = Record<string, TargetPageTreeWithFlatChildren<PageNodeWithPermissions> | null>

export async function multiResolvePageTree ({ pageIds, includeDeletedPages }: MultiPageTreeResolveInput): Promise<MultiPageTreeResolveOutput> {
  const pagesWithSpaceIds = (await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      }
    },
    select: {
      id: true,
      spaceId: true
    }
  })).map(p => p.spaceId);

  const uniqueSpaceIds = [...new Set(pagesWithSpaceIds)];

  if (uniqueSpaceIds.length !== 1) {
    throw new InvalidInputError('All pages must be in the same space');
  }

  const spaceId = uniqueSpaceIds[0];

  const pagesInSpace = await prisma.page.findMany(generatePagesQuery({ includeDeletedPages, spaceId }));

  const mappedResults = await Promise.all(pageIds.map(id => resolvePageTree({
    pageId: id,
    flattenChildren: true,
    includeDeletedPages,
    pageNodes: pagesInSpace
  }).catch(() => null)));

  return pageIds.reduce((acc, id, index) => {

    acc[id] = mappedResults[index];

    return acc;

  }, {} as MultiPageTreeResolveOutput);
}
