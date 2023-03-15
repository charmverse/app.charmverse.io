import { generatePage } from '__e2e__/utils/pages';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { removeGuest } from '../removeGuest';

describe('removeGuest', () => {
  it('should remove a guest by userId', async () => {
    const { user, space } = await generateUserAndSpace({
      isGuest: true
    });

    await removeGuest({
      spaceId: space.id,
      userId: user.id
    });

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId: space.id
      }
    });
    expect(spaceRoles).toHaveLength(0);
  });

  // This is a very important test - It prevents us accidentally deleting all page permissions for a space when removing a guest
  it('should delete only page permissions for pages in this space that are attached to the user', async () => {
    const { user: adminUser, space } = await generateUserAndSpace({
      isAdmin: true
    });

    const guest = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const pages = await Promise.all([
      generatePage({
        createdBy: adminUser.id,
        spaceId: space.id,
        pagePermissions: [
          {
            userId: guest.id,
            permissionLevel: 'editor'
          }
        ]
      }),
      generatePage({
        createdBy: adminUser.id,
        spaceId: space.id,
        pagePermissions: [
          {
            userId: guest.id,
            permissionLevel: 'editor'
          }
        ]
      }),
      generatePage({
        createdBy: adminUser.id,
        spaceId: space.id,
        pagePermissions: [
          {
            spaceId: space.id,
            permissionLevel: 'editor'
          }
        ]
      })
    ]);

    const pagePermissions = await prisma.pagePermission.findMany({
      where: {
        page: {
          spaceId: space.id
        }
      }
    });

    // 2 permissions for user + 1 for space
    expect(pagePermissions).toHaveLength(3);

    await removeGuest({
      spaceId: space.id,
      userId: guest.id
    });

    // Make sure role was deleted
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId: space.id
      }
    });

    // Only admin is left
    expect(spaceRoles).toHaveLength(1);
    expect(spaceRoles[0].userId).toBe(adminUser.id);

    const pagePermissionsAfterRemove = await prisma.pagePermission.findMany({
      where: {
        page: {
          spaceId: space.id
        }
      }
    });

    expect(pagePermissionsAfterRemove).toHaveLength(1);
    expect(pagePermissionsAfterRemove[0].spaceId).toBe(space.id);
  });

  it('should throw an error if the user is not a guest', async () => {
    const { user, space } = await generateUserAndSpace({
      isGuest: false
    });

    await expect(
      removeGuest({
        userId: user.id,
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('should throw an error if spaceId or userId is invalid', async () => {
    const { user, space } = await generateUserAndSpace({
      isGuest: false
    });

    await expect(
      removeGuest({
        userId: 'test-id',
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      removeGuest({
        userId: user.id,
        spaceId: 'test-id'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
