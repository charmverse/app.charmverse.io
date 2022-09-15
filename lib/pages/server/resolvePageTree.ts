import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { IPageWithPermissions, PageNodeWithPermissions, PageTreeResolveInput, TargetPageTree, TargetPageTreeWithFlatChildren } from '../interfaces';
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
// Normal page node
export async function resolvePageTree ({ pageId, flattenChildren }:
  PageTreeResolveInput & {flattenChildren?: undefined | false, fullPage?: false | undefined}): Promise<TargetPageTree<PageNodeWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren }:
  PageTreeResolveInput & {flattenChildren: true, fullPage?: false | undefined}): Promise<TargetPageTreeWithFlatChildren<PageNodeWithPermissions>>

// Full pages
export async function resolvePageTree ({ pageId, flattenChildren, fullPage }:
    PageTreeResolveInput & {flattenChildren?: undefined | false, fullPage: true}): Promise<TargetPageTree<IPageWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren }:
    PageTreeResolveInput & {flattenChildren: true, fullPage: true}): Promise<TargetPageTreeWithFlatChildren<IPageWithPermissions>>
export async function resolvePageTree ({ pageId, flattenChildren = false, includeDeletedPages = false, fullPage }:
  PageTreeResolveInput):
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

  const pageQuery: Partial<Prisma.PageFindManyArgs> = fullPage ? {
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

  const pagesInSpace = await prisma.page.findMany({
    where: {
      spaceId: pageWithSpaceIdOnly.spaceId,
      // Soft deleted pages have a value for deletedAt. Active pages are null
      deletedAt: includeDeletedPages ? undefined : null
    },
    ...pageQuery
  }) as any as PageNodeWithPermissions[] | IPageWithPermissions[];

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
