import { prisma } from '@charmverse/core';

import { InvalidInputError } from 'lib/utilities/errors';
import { uid } from 'lib/utilities/strings';

import { generateRole, generateUserAndSpaceWithApiToken } from '../setupDatabase';

describe('generateUserAndSpaceWithApiToken', () => {
  // Random key format - Ensures no conflicts if this is run against an existing database
  const walletAddress = Math.random().toString();

  it('should return a user and space', async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress });

    expect(generated.user).toBeInstanceOf(Object);
    expect(generated.space).toBeInstanceOf(Object);
  });

  it('should always return the same user and space for the same wallet address', async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress });
    const generated2 = await generateUserAndSpaceWithApiToken({ walletAddress });

    expect(generated.user.id).toEqual(generated2.user.id);
    expect(generated.space.id).toEqual(generated2.space.id);
  });

  it('should return the API token object for the space', async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress });

    expect(generated.apiToken).toBeDefined();
    expect(generated.apiToken).toBeInstanceOf(Object);
    expect(generated.apiToken.spaceId).toEqual(generated.space.id);
    expect(typeof generated.apiToken.token).toBe('string');
  });

  it('should always return the same api token for that space', async () => {
    const generated = await generateUserAndSpaceWithApiToken({ walletAddress });
    const generated2 = await generateUserAndSpaceWithApiToken({ walletAddress });

    expect(generated.apiToken.token).toEqual(generated2.apiToken.token);
  });

  it('should always generate a different wallet address, space and user if no address is provided', async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    const generated2 = await generateUserAndSpaceWithApiToken();

    expect(generated.user.id).not.toEqual(generated2.user.id);

    expect(generated.space.id).not.toEqual(generated2.space.id);

    expect(generated.user.wallets[0].address).not.toEqual(generated2.user.wallets[0].address);
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
