import type { Prisma, Space } from '@prisma/client';
import { v4, validate } from 'uuid';

import { prisma } from 'db';
import type { PageNodeWithChildren, PageNodeWithPermissions } from 'lib/pages';
import { multiResolvePageTree } from 'lib/pages/server/resolvePageTree';
import { hasSameOrMorePermissions, IPagePermissionWithSource } from 'lib/permissions/pages';

import { DataNotFoundError, InvalidInputError } from '../utilities/errors';

import type { PublicBountyToggle } from './interfaces';

async function generatePublicBountyPermissionArgs ({ publicBountyBoard, spaceId }: PublicBountyToggle<false>):
Promise<[Prisma.PagePermissionDeleteManyArgs | null]>
async function generatePublicBountyPermissionArgs ({ publicBountyBoard, spaceId }: PublicBountyToggle<true>):
Promise<[Prisma.PagePermissionDeleteManyArgs | null, Prisma.PagePermissionCreateManyArgs, Prisma.PagePermissionCreateManyArgs]>
async function generatePublicBountyPermissionArgs ({ publicBountyBoard, spaceId }: PublicBountyToggle):
Promise<[Prisma.PagePermissionDeleteManyArgs | null, Prisma.PagePermissionCreateManyArgs?, Prisma.PagePermissionCreateManyArgs?]> {
  const spaceBountyPages = await prisma.page.findMany({
    where: {
      spaceId,
      bountyId: {
        not: null
      },
      // If creating permissions, target only pages the space can view. Otherwise, lock all bounties down
      permissions: publicBountyBoard ? {
        some: {
          spaceId
        }
      } : undefined
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
  function extractInheritableChildren (
    { node,
      bountyPageId
    } : {
      node: PageNodeWithChildren<PageNodeWithPermissions>;
      bountyPageId: string;
    }
  ): void {
    node.children?.forEach(child => {
      const canInherit = hasSameOrMorePermissions(node.permissions, child.permissions);

      if (canInherit) {

        const sourcePermission = createArgs.find(a => a.pageId === bountyPageId);

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

  bountyTopPageIds.forEach(id => {
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

export async function togglePublicBounties ({ spaceId, publicBountyBoard }: PublicBountyToggle): Promise<Space> {

  if (typeof publicBountyBoard !== 'boolean') {
    throw new InvalidInputError('PublicBountyBoard must be true or false.');
  }
  else if (validate(spaceId) === false) {
    throw new InvalidInputError('Please provide a valid space ID.');
  }

  try {
    const spaceAfterUpdate = await prisma.$transaction(async (tx) => {
      const updatedSpace = await tx.space.update({
        where: { id: spaceId },
        data: {
          publicBountyBoard
        }
      });

      if (publicBountyBoard === true) {

        const [deleteArgs, createArgs, childCreateArgs] = await generatePublicBountyPermissionArgs({ publicBountyBoard, spaceId });

        if (deleteArgs) {
          await tx.pagePermission.deleteMany(deleteArgs);
        }

        await tx.pagePermission.createMany(createArgs);

        await tx.pagePermission.createMany(childCreateArgs);
      }
      else {
        const [deleteArgs] = await generatePublicBountyPermissionArgs({ publicBountyBoard, spaceId });

        if (deleteArgs) {
          await tx.pagePermission.deleteMany(deleteArgs);
        }
      }

      return updatedSpace;
    });

    return spaceAfterUpdate;
  }
  catch (err) {
    throw new DataNotFoundError(`Space ${spaceId} not found.`);
  }

}

