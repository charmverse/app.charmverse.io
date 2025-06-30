import type { Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/core/errors';
import type { PageNodeWithChildren, PageNodeWithPermissions } from '@packages/core/pages';
import { multiResolvePageTree } from '@packages/core/pages';
import type { PublicBountyToggle } from '@packages/core/permissions';
import { v4, validate } from 'uuid';

import { hasSameOrMorePermissions } from '../pagePermissions';

async function generatePublicBountyPermissionArgs({
  publicBountyBoard,
  spaceId
}: PublicBountyToggle): Promise<
  [
    Prisma.PagePermissionDeleteManyArgs | null,
    Prisma.PagePermissionCreateManyArgs?,
    Prisma.PagePermissionCreateManyArgs?
  ]
> {
  const spaceBountyPages = await prisma.page.findMany({
    where: {
      spaceId,
      bountyId: {
        not: null
      },
      // If creating permissions, target only pages the space can view. Otherwise, lock all bounties down
      permissions: publicBountyBoard
        ? {
            some: {
              spaceId
            }
          }
        : undefined
    },
    select: {
      id: true,
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const bountyTopPageIds = spaceBountyPages.map(({ id }) => id);

  const pageTrees = await multiResolvePageTree({
    pageIds: bountyTopPageIds,
    includeDeletedPages: false,
    flattenChildren: true
  });

  const childPageIds: string[] = [];

  Object.entries(pageTrees).forEach(([key, value]) => {
    if (value) {
      childPageIds.push(...value.flatChildren.map(({ id }) => id));
    }
  });

  const deleteArgs: Prisma.PagePermissionDeleteManyArgs = {
    where: {
      pageId: {
        in: [...bountyTopPageIds, ...childPageIds]
      },
      public: true
    }
  };

  if (!publicBountyBoard) {
    return bountyTopPageIds.length === 0 ? [null] : [deleteArgs];
  }

  // We are creating permissions, so we want to create them in 2 steps

  const createArgs: Prisma.PagePermissionCreateManyInput[] = bountyTopPageIds.map((id) => {
    return {
      id: v4(),
      pageId: id,
      permissionLevel: 'view',
      public: true
    };
  });

  const childCreateArgs: Prisma.PagePermissionCreateManyInput[] = [];

  /**
   * We need to create permissions for all child pages of the bounty pages
   * If this page already has a public permission, we don't need to change it
   */
  function extractInheritableChildren({
    node,
    bountyPageId
  }: {
    node: PageNodeWithChildren<PageNodeWithPermissions>;
    bountyPageId: string;
  }): void {
    node.children?.forEach((child) => {
      const canInherit = hasSameOrMorePermissions(node.permissions, child.permissions);

      if (canInherit) {
        const sourcePermission = createArgs.find((a) => a.pageId === bountyPageId);

        childCreateArgs.push({
          pageId: child.id,
          permissionLevel: 'view',
          public: true,
          inheritedFromPermission: sourcePermission?.id
        });

        extractInheritableChildren({
          node: child,
          bountyPageId
        });
      }
    });
  }

  bountyTopPageIds.forEach((id) => {
    const tree = pageTrees[id];

    if (tree) {
      extractInheritableChildren({
        node: tree.targetPage,
        bountyPageId: id
      });
    }
  });

  return [deleteArgs, { data: createArgs }, { data: childCreateArgs }];
}

export async function togglePublicBounties({ spaceId, publicBountyBoard }: PublicBountyToggle): Promise<Space> {
  if (typeof publicBountyBoard !== 'boolean') {
    throw new InvalidInputError('PublicBountyBoard must be true or false.');
  } else if (validate(spaceId) === false) {
    throw new InvalidInputError('Please provide a valid space ID.');
  }

  const [deleteArgs, createArgs, childCreateArgs] = await generatePublicBountyPermissionArgs({
    publicBountyBoard,
    spaceId
  });

  try {
    const spaceAfterUpdate = await prisma.$transaction(async (tx) => {
      const updatedSpace = await tx.space.update({
        where: { id: spaceId },
        data: {
          publicBountyBoard
        }
      });

      if (publicBountyBoard === true) {
        if (deleteArgs) {
          await tx.pagePermission.deleteMany(deleteArgs);
        }

        await tx.pagePermission.createMany(createArgs);

        await tx.pagePermission.createMany(childCreateArgs);
      } else if (deleteArgs) {
        await tx.pagePermission.deleteMany(deleteArgs);
      }

      return updatedSpace;
    });

    return spaceAfterUpdate;
  } catch (error) {
    if ((error as any).code === 'P2025') {
      throw new DataNotFoundError('Space not found.');
    }
    throw error;
  }
}
