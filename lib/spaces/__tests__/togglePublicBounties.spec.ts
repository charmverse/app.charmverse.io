import type { PageType, Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { createPage, generateBounty, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { togglePublicBounties } from '../togglePublicBounties';

type SyntheticBountyInput = { id: string, type: PageType, pagePermissions: Prisma.PagePermissionCreateManyPageInput[] }

describe('togglePublicBounties', () => {

  it('should update the space to the new value', async () => {

    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    let updatedSpace = await togglePublicBounties({
      spaceId: space.id,
      publicBountyBoard: false
    });

    expect(updatedSpace.id).toBe(space.id);
    expect(updatedSpace.publicBountyBoard).toBe(false);

    updatedSpace = await togglePublicBounties({
      spaceId: space.id,
      publicBountyBoard: true
    });

    expect(updatedSpace.publicBountyBoard).toBe(true);

  });

  it('should upsert a public view permission for all pages with a linked bounty that the space can view, including the child pages which can inherit permissions', async () => {

    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const privatePages: SyntheticBountyInput[] = [
      {
        id: v4(),
        type: 'bounty',
        pagePermissions: [{
          userId: user.id,
          permissionLevel: 'full_access'
        }]
      },
      {
        id: v4(),
        type: 'card',
        pagePermissions: [{
          userId: user.id,
          permissionLevel: 'full_access'
        }]
      }
    ];

    const publicPages: SyntheticBountyInput[] = [
      {
        id: v4(),
        type: 'bounty',
        pagePermissions: [{
          spaceId: space.id,
          permissionLevel: 'view'
        },
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }]
      },
      {
        id: v4(),
        type: 'card',
        pagePermissions: [{
          spaceId: space.id,
          permissionLevel: 'view'
        },
        {
          userId: user.id,
          permissionLevel: 'full_access'
        }]
      }
    ];

    await Promise.all([...privatePages, ...publicPages].map(async p => {

      const bounty = await generateBounty({
        id: p.id,
        approveSubmitters: true,
        createdBy: user.id,
        spaceId: space.id,
        status: 'open',
        type: p.type,
        pagePermissions: p.pagePermissions
      });

      await createPage({
        createdBy: user.id,
        spaceId: space.id,
        parentId: bounty.page.id,
        pagePermissions: p.pagePermissions
      });

    }));

    await togglePublicBounties({
      publicBountyBoard: true,
      spaceId: space.id
    });

    const publicAfterModification = await prisma.page.findMany({
      where: {
        OR: [{
          id: {
            in: publicPages.map(p => p.id)
          }
        }, {
          parentId: {
            in: publicPages.map(p => p.id)
          }
        }]
      },
      include: {
        permissions: {
          include: {
            sourcePermission: true
          }
        }
      }
    });

    const privateAfterModification = await prisma.page.findMany({
      where: {
        OR: [{
          id: {
            in: privatePages.map(p => p.id)
          }
        }, {
          parentId: {
            in: privatePages.map(p => p.id)
          }
        }]
      },
      include: {
        permissions: {
          include: {
            sourcePermission: true
          }
        }
      }
    });

    publicAfterModification.forEach(p => {
      // Permissions should be initial set plus the public one
      expect(p.permissions.length).toBe(3);
      expect(p.permissions.some(perm => perm.spaceId === space.id)).toBe(true);
      expect(p.permissions.some(perm => perm.userId === user.id)).toBe(true);
      expect(p.permissions.some(perm => perm.public === true)).toBe(true);
    });

    privateAfterModification.forEach(p => {
      // Permissions should be unchanged
      expect(p.permissions.length).toBe(1);
      expect(p.permissions.every(permission => permission.userId === user.id)).toBe(true);
    });
  });

  it('should remove the public view permission for all pages with a linked bounty that the space can view, as well as children of those bounty pages', async () => {

    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const publicPages: SyntheticBountyInput[] = [
      {
        id: v4(),
        type: 'bounty',
        pagePermissions: [{
          spaceId: space.id,
          permissionLevel: 'view'
        },
        {
          userId: user.id,
          permissionLevel: 'full_access'
        },
        {
          public: true,
          permissionLevel: 'view'
        }]
      },
      {
        id: v4(),
        type: 'card',
        pagePermissions: [{
          spaceId: space.id,
          permissionLevel: 'view'
        },
        {
          userId: user.id,
          permissionLevel: 'full_access'
        },
        {
          public: true,
          permissionLevel: 'view'
        }]
      }
    ];

    await Promise.all(publicPages.map(async p => {

      const bounty = await generateBounty({
        id: p.id,
        approveSubmitters: true,
        createdBy: user.id,
        spaceId: space.id,
        status: 'open',
        type: p.type,
        pagePermissions: p.pagePermissions
      });

      await createPage({
        createdBy: user.id,
        spaceId: space.id,
        parentId: bounty.page.id,
        pagePermissions: p.pagePermissions
      });

    }));

    await togglePublicBounties({
      publicBountyBoard: false,
      spaceId: space.id
    });

    const publicAfterModification = await prisma.page.findMany({
      where: {
        OR: [{
          id: {
            in: publicPages.map(p => p.id)
          }
        }, {
          parentId: {
            in: publicPages.map(p => p.id)
          }
        }]
      },
      include: {
        permissions: {
          include: {
            sourcePermission: true
          }
        }
      }
    });

    publicAfterModification.forEach(p => {
      // Permissions should be initial set without the public one
      expect(p.permissions.length).toBe(2);
      expect(p.permissions.every(perm => perm.public === null)).toBe(true);
    });
  });

  it('should fail if an invalid value for public bounty board is provided', async () => {
    await expect(togglePublicBounties({
      spaceId: v4(),
      publicBountyBoard: 'Not a boolean' as any
    })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail if an invalid space id is provided', async () => {
    await expect(togglePublicBounties({
      spaceId: 'Not a valid uuid',
      publicBountyBoard: false
    })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail if the space does not exist', async () => {
    await expect(togglePublicBounties({
      spaceId: v4(),
      publicBountyBoard: false
    })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
