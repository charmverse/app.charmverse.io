import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';

import { generateRole, generateUserAndSpace } from '../setupDatabase';

describe('generateUserAndSpace', () => {
  // Random key format - Ensures no conflicts if this is run against an existing database
  const walletAddress = Math.random().toString();

  it('should return a user and space', async () => {
    const generated = await generateUserAndSpace();

    expect(generated.user).toBeInstanceOf(Object);
    expect(generated.space).toBeInstanceOf(Object);
  });

  it('should return the API token object for the space', async () => {
    const generated = await generateUserAndSpace({ walletAddress, apiToken: '12345' });

    expect(generated.space).toBeDefined();
    expect(generated.space.apiToken).toBeInstanceOf(Object);
    expect(generated.space.apiToken?.spaceId).toEqual(generated.space.id);
    expect(typeof generated.space.apiToken?.token).toBe('string');
  });

  it('should return api token only if required', async () => {
    const generated = await generateUserAndSpace({ apiToken: '12345' });
    const generated2 = await generateUserAndSpace();

    expect(generated.space.apiToken?.token).toBe('12345');
    expect(generated2.space.apiToken?.token).toBe(undefined);
  });

  it('should always generate a wallet address, if wallet address is provided', async () => {
    const generated = await generateUserAndSpace({ walletAddress: '0x1234' });
    const generated2 = await generateUserAndSpace();

    expect(generated.user.id).not.toEqual(generated2.user.id);
    expect(generated.space.id).not.toEqual(generated2.space.id);

    expect(generated.user.wallets[0].address).toBe('0x1234');
    expect(generated2.user.wallets?.[0]?.address).toBe(undefined);
  });
});

describe('generateRole', () => {
  it('should generate a role and optionally assign some users to it', async () => {
    const users = await Promise.all([
      prisma.user.create({
        data: {
          path: uid(),
          username: 'test'
        }
      }),
      prisma.user.create({
        data: {
          path: uid(),
          username: 'test'
        }
      })
    ]);

    const space = await prisma.space.create({
      data: {
        domain: `test-${uid()}`,
        name: 'test name',
        updatedBy: users[0].id,
        author: {
          connect: {
            id: users[0].id
          }
        },
        spaceRoles: {
          createMany: {
            data: [
              {
                userId: users[0].id
              },
              {
                userId: users[1].id
              }
            ]
          }
        }
      }
    });

    const role = await generateRole({
      createdBy: users[0].id,
      spaceId: space.id,
      assigneeUserIds: users.map((u) => u.id)
    });

    const withAssignees = await prisma.role.findUnique({
      where: {
        id: role.id
      },
      include: {
        spaceRolesToRole: {
          include: {
            spaceRole: true
          }
        }
      }
    });

    // Make sure assignment worked
    expect(withAssignees?.spaceRolesToRole.length).toEqual(2);
    expect(withAssignees?.spaceRolesToRole.some((sr) => sr.spaceRole.userId === users[0].id)).toEqual(true);
    expect(withAssignees?.spaceRolesToRole.some((sr) => sr.spaceRole.userId === users[1].id)).toEqual(true);
  });

  it('should throw an error if trying to assign a user not belonging to this spaces', async () => {
    const [spaceUser, outsideUser] = await Promise.all([
      prisma.user.create({
        data: {
          path: uid(),
          username: 'test'
        }
      }),
      prisma.user.create({
        data: {
          path: uid(),
          username: 'test'
        }
      })
    ]);

    const space = await prisma.space.create({
      data: {
        domain: `test-${uid()}`,
        name: 'test name',
        updatedBy: spaceUser.id,
        author: {
          connect: {
            id: spaceUser.id
          }
        },
        spaceRoles: {
          createMany: {
            data: [
              {
                userId: spaceUser.id
              }
            ]
          }
        }
      }
    });

    await expect(
      generateRole({
        createdBy: spaceUser.id,
        spaceId: space.id,
        assigneeUserIds: [outsideUser.id]
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
