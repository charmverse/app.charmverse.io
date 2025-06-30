import type { Page, Prisma, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError, PageNotFoundError } from '../errors';

import type {
  PageMetaWithPermissions,
  PageNodeWithPermissions,
  PageTreeResolveInput,
  PageWithPermissions,
  TargetPageTree,
  TargetPageTreeWithFlatChildren
} from './interfaces';
import { flattenTree, mapTargetPageTree } from './mapPageTree';

function generatePagesQuery({
  includeDeletedPages,
  fullPage,
  pageIds,
  spaceId,
  findManyArgs
}: {
  includeDeletedPages?: boolean;
  fullPage?: boolean;
  pageIds?: string[];
  spaceId?: string;
  findManyArgs?: Prisma.PageFindManyArgs;
}) {
  if (!pageIds && !spaceId) {
    throw new InvalidInputError(`1 of spaceId or pageIds is required`);
  }

  const pageQueryContent: Partial<Prisma.PageFindManyArgs> =
    findManyArgs ||
    (fullPage
      ? {
          include: {
            permissions: {
              include: {
                sourcePermission: true
              }
            }
          }
        }
      : {
          select: {
            id: true,
            parentId: true,
            boardId: true,
            cardId: true,
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
        });

  return {
    where: {
      spaceId,
      id: {
        in: pageIds
      },
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
export async function resolvePageTree({
  pageId,
  flattenChildren,
  findManyArgs,
  fullPage
}: PageTreeResolveInput & {
  flattenChildren?: undefined | false;
  fullPage?: false | undefined;
} & OptionalPrismaTransaction): Promise<TargetPageTree<PageNodeWithPermissions>>;
export async function resolvePageTree({
  pageId,
  flattenChildren,
  findManyArgs,
  fullPage
}: PageTreeResolveInput & {
  flattenChildren: true;
  fullPage?: false | undefined;
} & OptionalPrismaTransaction): Promise<TargetPageTreeWithFlatChildren<PageNodeWithPermissions>>;
// Full pages
export async function resolvePageTree({
  pageId,
  flattenChildren,
  fullPage,
  findManyArgs
}: PageTreeResolveInput & { flattenChildren?: undefined | false; fullPage: true } & OptionalPrismaTransaction): Promise<
  TargetPageTree<PageWithPermissions>
>;
export async function resolvePageTree({
  pageId,
  flattenChildren,
  findManyArgs,
  fullPage
}: PageTreeResolveInput & OptionalPrismaTransaction): Promise<TargetPageTreeWithFlatChildren<PageWithPermissions>>;
export async function resolvePageTree({
  pageId,
  flattenChildren = false,
  includeDeletedPages = false,
  fullPage,
  findManyArgs,
  tx = prisma
}: PageTreeResolveInput & OptionalPrismaTransaction): Promise<
  TargetPageTree<PageNodeWithPermissions> | TargetPageTreeWithFlatChildren<PageNodeWithPermissions>
> {
  const pageWithSpaceIdOnly = await tx.page.findUnique({
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
  const pagesTreeIds = (await tx.$queryRaw`WITH RECURSIVE parents_cte AS (
    SELECT id, "parentId", ARRAY[id] AS path
    FROM "Page"
    WHERE id = ${pageId}::UUID

    UNION ALL

    SELECT p.id, p."parentId", pc.path || p.id
    FROM "Page" p
    INNER JOIN parents_cte pc ON p.id = pc."parentId"
    WHERE NOT p.id = ANY(pc.path)
  ), children_cte AS (
    SELECT id, "parentId", ARRAY[id] AS path
    FROM "Page"
    WHERE id = ${pageId}::UUID

    UNION ALL

    SELECT p.id, p."parentId", cc.path || p.id
    FROM "Page" p
    INNER JOIN children_cte cc ON p."parentId" = cc.id
    WHERE NOT p.id = ANY(cc.path)
  )
  SELECT id FROM parents_cte
  UNION
  SELECT id FROM children_cte;`) as Pick<Page, 'id'>[];

  const pagesInSpace = (await tx.page.findMany(
    generatePagesQuery({
      includeDeletedPages,
      pageIds: pagesTreeIds?.map((p) => p.id) ?? [],
      fullPage,
      findManyArgs
    })
  )) as PageNodeWithPermissions[] | PageWithPermissions[];
  const { parents, targetPage } = mapTargetPageTree({
    items: pagesInSpace,
    targetPageId: pageId,
    includeDeletedPages
  });

  // Prune the parent references so we have a direct chain
  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];

    parent.children = parent.children.filter((child) => {
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

export type MultiPageTreeResolveInput<F extends boolean | undefined = boolean> = Pick<
  PageTreeResolveInput,
  'includeDeletedPages' | 'fullPage' | 'findManyArgs'
> & { pageIds: string[]; flattenChildren?: F };

/**
 * Resolved page trees mapped to the page id
 * @F Whether to have the flat children
 */
export type MultiPageTreeResolveOutput<F extends boolean | undefined = false> = Record<
  string,
  | (F extends true ? TargetPageTreeWithFlatChildren<PageNodeWithPermissions> : TargetPageTree<PageNodeWithPermissions>)
  | null
>;

export async function multiResolvePageTree({
  pageIds,
  includeDeletedPages,
  flattenChildren,
  fullPage,
  findManyArgs
}: MultiPageTreeResolveInput<false | undefined>): Promise<MultiPageTreeResolveOutput<false | undefined>>;
export async function multiResolvePageTree({
  pageIds,
  includeDeletedPages,
  flattenChildren,
  fullPage
}: MultiPageTreeResolveInput<true>): Promise<MultiPageTreeResolveOutput<true>>;
export async function multiResolvePageTree<F extends boolean | undefined>({
  pageIds,
  includeDeletedPages,
  flattenChildren,
  fullPage,
  findManyArgs,
  tx = prisma
}: MultiPageTreeResolveInput<F> & OptionalPrismaTransaction): Promise<MultiPageTreeResolveOutput<F>> {
  const pagesWithSpaceIds = (
    await tx.page.findMany({
      where: {
        id: {
          in: pageIds
        }
      },
      select: {
        id: true,
        spaceId: true
      }
    })
  ).map((p) => p.spaceId);

  const uniqueSpaceIds = [...new Set(pagesWithSpaceIds)];

  if (uniqueSpaceIds.length > 1) {
    throw new InvalidInputError('All pages must be in the same space');
  } else if (uniqueSpaceIds.length === 0) {
    return {};
  }

  const pagesTreeIds = (await tx.$queryRaw`WITH RECURSIVE parents_cte AS (
    SELECT id, "parentId", ARRAY[id] AS path
    FROM "Page"
    WHERE id = ANY(ARRAY[${pageIds}]::UUID[])

    UNION ALL

    SELECT p.id, p."parentId", pc.path || p.id
    FROM "Page" p
    INNER JOIN parents_cte pc ON p.id = pc."parentId"
    WHERE NOT p.id = ANY(pc.path)
  ), children_cte AS (
    SELECT id, "parentId", ARRAY[id] AS path
    FROM "Page"
    WHERE id = ANY(ARRAY[${pageIds}]::UUID[])

    UNION ALL

    SELECT p.id, p."parentId", cc.path || p.id
    FROM "Page" p
    INNER JOIN children_cte cc ON p."parentId" = cc.id
    WHERE NOT p.id = ANY(cc.path)
  )
  SELECT id FROM parents_cte
  UNION
  SELECT id FROM children_cte;`) as Pick<Page, 'id'>[];

  const pagesInSpace = (await tx.page.findMany(
    generatePagesQuery({
      includeDeletedPages,
      pageIds: pagesTreeIds.map((p) => p.id),
      fullPage,
      findManyArgs
    })
  )) as PageNodeWithPermissions[] | PageWithPermissions[];

  const pagemap = (pagesInSpace as PageNodeWithPermissions[]).reduce(
    (acc, val) => {
      acc[val.id] = val;
      return acc;
    },
    {} as Record<string, PageNodeWithPermissions>
  );

  let mappedResults = pageIds.map((id) =>
    pagemap[id]
      ? mapTargetPageTree({
          items: pagesInSpace,
          targetPageId: id,
          includeDeletedPages
        })
      : null
  );

  if (flattenChildren) {
    mappedResults = mappedResults.map((tree) => {
      return tree
        ? ({
            ...tree,
            flatChildren: flattenTree(tree.targetPage)
          } as TargetPageTreeWithFlatChildren<PageMetaWithPermissions>)
        : null;
    });
  }

  return pageIds.reduce((acc, id, index) => {
    acc[id] = mappedResults[index] as any;

    return acc;
  }, {} as MultiPageTreeResolveOutput<F>);
}
