import type { Role, Space, SpaceRole, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { createUserWithWallet } from '@packages/testing/setupDatabase';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { v4 } from 'uuid';

let user: User;
let space1: Space;
let space2: Space;
let userSpaceRole1: SpaceRole;
let userSpaceRole2: SpaceRole;
let space1guildRole1: Role;
let space1guildRole2: Role;
let space2guildRole1: Role;
let space2guildRole2: Role;

beforeAll(async () => {
  user = await createUserWithWallet({
    address: randomETHWalletAddress()
  });
  space1 = await prisma.space.create({
    data: {
      domain: v4(),
      name: 'Space 1',
      author: {
        connect: {
          id: user.id
        }
      },
      updatedBy: user.id,
      updatedAt: new Date().toISOString()
    }
  });

  space2 = await prisma.space.create({
    data: {
      domain: v4(),
      name: 'Space 2',
      author: {
        connect: {
          id: user.id
        }
      },
      updatedBy: user.id,
      updatedAt: new Date().toISOString()
    }
  });

  userSpaceRole1 = (await prisma.spaceRole.create({
    data: {
      userId: user.id,
      spaceId: space1.id
    }
  })) as SpaceRole;

  userSpaceRole2 = (await prisma.spaceRole.create({
    data: {
      userId: user.id,
      spaceId: space2.id
    }
  })) as SpaceRole;

  space1guildRole1 = await prisma.role.create({
    data: {
      name: 'Space 1 Guild Role 1',
      space: {
        connect: {
          id: space1.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'S1GR1',
      createdBy: user.id
    }
  });

  space1guildRole2 = await prisma.role.create({
    data: {
      name: 'Space 1 Guild Role 2',
      space: {
        connect: {
          id: space1.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'S1GR2',
      createdBy: user.id
    }
  });

  space2guildRole1 = await prisma.role.create({
    data: {
      name: 'Space 2 Guild Role 1',
      space: {
        connect: {
          id: space2.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'S2GR1',
      createdBy: user.id
    }
  });

  space2guildRole2 = await prisma.role.create({
    data: {
      name: 'Space 2 Guild Role 2',
      space: {
        connect: {
          id: space2.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'S2GR2',
      createdBy: user.id
    }
  });

  // Connecting the user1 to the guild imported role
  await prisma.spaceRoleToRole.create({
    data: {
      role: {
        connect: {
          id: space1guildRole2.id
        }
      },
      spaceRole: {
        connect: {
          id: userSpaceRole1.id
        }
      }
    }
  });
});

it('Should correctly update guild roles for space', async () => {
  jest.mock('lib/guild-xyz/client', () => ({
    user: {
      getMemberships: () => {
        return [
          {
            roleids: ['S1GR1']
          },
          {
            roleIds: ['S2GR1', 'S2GR2']
          }
        ];
      }
    }
  }));

  const { updateGuildRolesForUser } = await import('../server/updateGuildRolesForUser');

  const profile = await prisma.user.findUnique({
    where: {
      id: user.id
    },
    include: {
      wallets: true,
      spaceRoles: {
        include: {
          spaceRoleToRole: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  if (profile) {
    await updateGuildRolesForUser(
      profile.wallets.map((w) => w.address),
      profile.spaceRoles
    );
  }

  // Check if the roles were created correctly mapped
  const s1gr1 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: space1guildRole1.id,
      spaceRoleId: userSpaceRole1.id
    }
  });

  const s1gr2 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: space1guildRole2.id,
      spaceRoleId: userSpaceRole1.id
    }
  });

  const s2gr1 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: space2guildRole1.id,
      spaceRoleId: userSpaceRole2.id
    }
  });

  const s2gr2 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: space2guildRole2.id,
      spaceRoleId: userSpaceRole2.id
    }
  });

  expect(s1gr1).not.toBeNull();
  expect(s2gr1).not.toBeNull();
  expect(s2gr2).not.toBeNull();
  expect(s1gr2).toBeNull();
});

afterAll(async () => {
  await prisma.user.delete({
    where: {
      id: user.id
    }
  });

  await prisma.space.deleteMany({
    where: {
      id: {
        in: [space1.id, space2.id]
      }
    }
  });
});
