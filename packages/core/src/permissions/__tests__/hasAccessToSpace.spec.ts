import type { Space, SpaceRole, User } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { prisma } from 'prisma-client';
import { v4 as uuid } from 'uuid';

import { generateSpaceUser, generateUserAndSpace } from 'lib/testing/user';

import { InvalidInputError } from '../../errors';
import { hasAccessToSpace } from '../hasAccessToSpace';

let space: Space;
let adminUser: User;
let memberUser: User;
let guestUser: User;

let outsideUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  memberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  outsideUser = await prisma.user.create({
    data: {
      path: uuid(),
      username: 'Test user'
    }
  });
  guestUser = await generateSpaceUser({
    spaceId: space.id,
    isGuest: true
  });
});

describe('hasAccessToSpace', () => {
  it('should return a null spaceRole if userId is empty', async () => {
    const { spaceRole } = await hasAccessToSpace({
      spaceId: space.id,
      userId: undefined
    });

    expect(spaceRole).toBe(null);
  });
  it('should throw an error if spaceId is empty', async () => {
    await expect(
      hasAccessToSpace({
        spaceId: undefined as any,
        userId: uuid()
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should return success and admin status of the admin user', async () => {
    const { spaceRole, isAdmin } = await hasAccessToSpace({
      spaceId: space.id,
      userId: adminUser.id
    });

    expect(isAdmin).toBe(true);
    expect(spaceRole).toMatchObject<SpaceRole>(
      expect.objectContaining({
        id: expect.any(String),
        isAdmin: true,
        isGuest: false,
        spaceId: space.id,
        userId: adminUser.id,
        space: {
          subscriptionTier: space.subscriptionTier
        }
      })
    );
  });

  it('should return success and admin status of the member user', async () => {
    const { spaceRole, isAdmin } = await hasAccessToSpace({
      spaceId: space.id,
      userId: memberUser.id
    });
    expect(isAdmin).toBe(false);
    expect(spaceRole).toMatchObject<SpaceRole>(
      expect.objectContaining({
        id: expect.any(String),
        isAdmin: false,
        isGuest: false,
        spaceId: space.id,
        userId: memberUser.id
      })
    );
  });

  it('should return success if user is a guest', async () => {
    const { spaceRole, isAdmin } = await hasAccessToSpace({
      spaceId: space.id,
      userId: guestUser.id
    });

    expect(isAdmin).toBe(false);
    expect(spaceRole).toMatchObject(
      expect.objectContaining({
        id: expect.any(String),
        isAdmin: false,
        isGuest: true,
        spaceId: space.id,
        userId: guestUser.id,
        space: {
          subscriptionTier: space.subscriptionTier
        }
      })
    );
  });

  it('should return a null space role for non space members', async () => {
    const { spaceRole, isAdmin } = await hasAccessToSpace({
      spaceId: space.id,
      userId: outsideUser.id
    });

    expect(spaceRole).toBe(null);
    expect(isAdmin).toBeUndefined();
  });

  it('should use the provided spaceRole if userId and spaceId are a match to evaluate OR the spaceRole is null', async () => {
    const adminSpaceRole = await prisma.spaceRole.findUniqueOrThrow({
      where: {
        spaceUser: {
          userId: adminUser.id,
          spaceId: space.id
        }
      },
      include: {
        space: {
          select: {
            subscriptionTier: true
          }
        }
      }
    });

    const mockPrisma = jest.fn();

    jest.doMock('@charmverse/core/prisma-client', () => ({
      prisma: {
        spaceRole: {
          findUnique: mockPrisma,
          findFirst: mockPrisma
        } as any
      } as Partial<typeof prisma>
    }));

    const { hasAccessToSpace: hasAccessToSpaceWithMockedPrisma } = await import('../hasAccessToSpace');

    const { spaceRole: evaluatedSpaceRole } = await hasAccessToSpaceWithMockedPrisma({
      spaceId: space.id,
      userId: adminUser.id,
      preComputedSpaceRole: adminSpaceRole
    });

    expect(evaluatedSpaceRole).toMatchObject<SpaceRole>(adminSpaceRole);
    expect(mockPrisma).not.toHaveBeenCalled();

    const { spaceRole: evaluatedSpaceRole2, isAdmin: isAdmin2 } = await hasAccessToSpaceWithMockedPrisma({
      spaceId: space.id,
      userId: adminUser.id,
      preComputedSpaceRole: null
    });

    expect(evaluatedSpaceRole2).toBe(null);

    expect(isAdmin2).toBeUndefined();

    expect(mockPrisma).not.toHaveBeenCalled();

    jest.dontMock('@charmverse/core/prisma-client');
  });

  it('should throw an error if a spaceRole is provided that does not match the provided userId and spaceId', async () => {
    const mockSpaceRole = {
      createdAt: new Date(),
      id: uuid(),
      isAdmin: false,
      isGuest: true,
      onboarded: true,
      spaceId: uuid(),
      userId: uuid(),
      space: {
        subscriptionTier: 'gold' as const
      }
    };
    await expect(
      hasAccessToSpace({
        spaceId: space.id,
        userId: guestUser.id,
        preComputedSpaceRole: {
          ...mockSpaceRole,
          spaceId: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      hasAccessToSpace({
        spaceId: space.id,
        userId: guestUser.id,
        preComputedSpaceRole: {
          ...mockSpaceRole,
          userId: uuid()
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      hasAccessToSpace({
        spaceId: space.id,
        // Make sure the an early null from inexistent userId doesn't happen
        userId: undefined,
        preComputedSpaceRole: {
          ...mockSpaceRole,
          userId: uuid()
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should return a readonly space if the space is readonly', async () => {
    const { user, space: testSpace } = await generateUserAndSpace({
      subscriptionTier: 'readonly'
    });
    const { isReadonlySpace } = await hasAccessToSpace({
      spaceId: testSpace.id,
      userId: user.id
    });
    expect(isReadonlySpace).toBe(true);
  });

  it('should not return a readonly space if the space is gold tier', async () => {
    const { user, space: testSpace } = await generateUserAndSpace({
      subscriptionTier: 'gold'
    });
    const { isReadonlySpace } = await hasAccessToSpace({
      spaceId: testSpace.id,
      userId: user.id
    });
    expect(isReadonlySpace).toBe(false);
  });
});
