import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors';
import { IPageWithPermissions, PageNodeWithPermissions, PageTreeResolveInput, TargetPageTree, TargetPageTreeWithFlatChildren } from '../interfaces';
import { mapTargetPageTree, flattenTree } from '../mapPageTree';
import { PageNotFoundError } from './errors';

function generatePagesQuery ({ spaceId, includeDeletedPages, fullPage }: {spaceId: string, includeDeletedPages?: boolean, fullPage?: boolean}) {

  const pageQueryContent: Partial<Prisma.PageFindManyArgs> = fullPage ? {
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  } : {
    select: {
      id: true,
      parentId: true,
      boardId: true,
      cardId: true,
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
  };

  return {
    where: {
      spaceId,
      // Soft deleted pages have a value for deletedAt. Active pages are null
      deletedAt: includeDeletedPages ? undefined : null
    },
    ...pageQueryContent
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
// Normal page node
export async function resolvePageTree ({ pageId, flattenChildren, fullPage, pageNodes }:
  PageTreeResolveInput & {flattenChildren?: undefined | false, fullPage?: false | undefined}): Promise<TargetPageTree<PageNodeWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren, fullPage, pageNodes }:
  PageTreeResolveInput & {flattenChildren: true, fullPage?: false | undefined}): Promise<TargetPageTreeWithFlatChildren<PageNodeWithPermissions>>
// Full pages
export async function resolvePageTree ({ pageId, flattenChildren, fullPage, pageNodes }:
    PageTreeResolveInput & {flattenChildren?: undefined | false, fullPage: true}): Promise<TargetPageTree<IPageWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren, fullPage, pageNodes }:
    PageTreeResolveInput & {flattenChildren: true, fullPage: true}): Promise<TargetPageTreeWithFlatChildren<IPageWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren = false, includeDeletedPages = false, fullPage, pageNodes }:
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

  const pagesInSpace = (pageNodes ?? await prisma.page.findMany(generatePagesQuery({
    includeDeletedPages, spaceId: pageWithSpaceIdOnly.spaceId, fullPage
  }))) as (PageNodeWithPermissions[] | IPageWithPermissions[]);

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

export type MultiPageTreeResolveInput<F extends boolean | undefined = boolean> = Pick<PageTreeResolveInput, 'includeDeletedPages' | 'fullPage'> & {pageIds: string[], flattenChildren?: F}

/**
 * Resolved page trees mapped to the page id
 * @F Whether to have the flat children
 */
export type MultiPageTreeResolveOutput<F extends boolean | undefined = false>
 = Record<string,
 (F extends true ? TargetPageTreeWithFlatChildren<PageNodeWithPermissions> :
  TargetPageTree<PageNodeWithPermissions>)
  | null>

export async function multiResolvePageTree({
  pageIds,
  includeDeletedPages,
  flattenChildren,
  fullPage
}: MultiPageTreeResolveInput<false | undefined>): Promise<MultiPageTreeResolveOutput<false | undefined>>
export async function multiResolvePageTree({
  pageIds,
  includeDeletedPages,
  flattenChildren,
  fullPage
}: MultiPageTreeResolveInput<true>): Promise<MultiPageTreeResolveOutput<true>>
export async function multiResolvePageTree<F extends boolean | undefined> ({
  pageIds,
  includeDeletedPages,
  flattenChildren,
  fullPage
}: MultiPageTreeResolveInput<F>):
Promise<MultiPageTreeResolveOutput<F>> {
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

  if (uniqueSpaceIds.length > 1) {
    throw new InvalidInputError('All pages must be in the same space');
  }
  else if (uniqueSpaceIds.length === 0) {
    return {};
  }

  const spaceId = uniqueSpaceIds[0];

  const pagesInSpace = await prisma.page.findMany(generatePagesQuery({
    includeDeletedPages, spaceId
  })) as (PageNodeWithPermissions[] | IPageWithPermissions[]);

  const mappedResults = await Promise.all(pageIds.map(id => resolvePageTree({
    pageId: id,
    flattenChildren: flattenChildren as any,
    includeDeletedPages,
    fullPage: fullPage as any,
    pageNodes: pagesInSpace
  }).catch(() => null)));

  return pageIds.reduce((acc, id, index) => {

    acc[id] = mappedResults[index] as any;

    return acc;

  }, {} as MultiPageTreeResolveOutput<F>);
}
