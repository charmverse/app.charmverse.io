
import type { Role, Space, SpaceRole, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createUserFromWallet } from 'lib/users/createUser';
import type { LoggedInUser } from 'models';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user1: LoggedInUser;
let user2: LoggedInUser;
let space: Space;
let user1SpaceRole: SpaceRole;
let user2SpaceRole: SpaceRole;
let guild1Role1: Role;
let guild1Role2: Role;
let guild2Role1: Role;
let guild2Role2: Role;

beforeAll(async () => {
  const { space: createdSpace, user } = await generateUserAndSpaceWithApiToken(v4());
  user1 = user;
  user2 = await createUserFromWallet(v4());
  space = createdSpace;
  user1SpaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId: user1.id,
      spaceId: space.id
    }
  }) as SpaceRole;

  // Make user2 a member of the space
  user2SpaceRole = await prisma.spaceRole.create({
    data: {
      space: {
        connect: {
          id: space.id
        }
      },
      user: {
        connect: {
          id: user2.id
        }
      }
    }
  });

  guild1Role1 = await prisma.role.create({
    data: {
      name: 'Guild 1 Role 1',
      space: {
        connect: {
          id: space.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'G1R1',
      createdBy: user1.id
    }
  });

  guild1Role2 = await prisma.role.create({
    data: {
      name: 'Guild 1 Role 2',
      space: {
        connect: {
          id: space.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'G1R2',
      createdBy: user1.id
    }
  });

  guild2Role1 = await prisma.role.create({
    data: {
      name: 'Guild 2 Role 1',
      space: {
        connect: {
          id: space.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'G2R1',
      createdBy: user1.id
    }
  });

  guild2Role2 = await prisma.role.create({
    data: {
      name: 'Guild 2 Role 2',
      space: {
        connect: {
          id: space.id
        }
      },
      source: 'guild_xyz',
      sourceId: 'G2R2',
      createdBy: user1.id
    }
  });

  // Connecting the user1 to the guild imported role
  await prisma.spaceRoleToRole.create({
    data: {
      role: {
        connect: {
          id: guild2Role2.id
        }
      },
      spaceRole: {
        connect: {
          id: user1SpaceRole.id
        }
      }
    }
  });
});

it('Should correctly update guild roles for space', async () => {
  jest.mock('@guildxyz/sdk', () => ({
    user: {
      getMemberships: (address: string) => {
        if (address === user1.wallets[0].address) {
          return [{
            roleids: ['G1R1']
          }, {
            roleids: ['G2R1']
          }];
        }
        return [{
          roleids: ['G1R1', 'G1R2']
        }];
      }
    }
  }));

  const { updateGuildRolesForSpace } = await import('../server/updateGuildRolesForSpace');

  await updateGuildRolesForSpace(space.id);
  // Check if the roles were created correctly mapped
  const u1g1r1 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: guild1Role1.id,
      spaceRoleId: user1SpaceRole.id
    }
  });

  const u2g1r1 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: guild1Role1.id,
      spaceRoleId: user2SpaceRole.id
    }
  });

  const u2g1r2 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: guild1Role2.id,
      spaceRoleId: user2SpaceRole.id
    }
  });

  const u1g2r1 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: guild2Role1.id,
      spaceRoleId: user1SpaceRole.id
    }
  });

  // This role should be removed
  const u1g2r2 = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: guild2Role2.id,
      spaceRoleId: user1SpaceRole.id
    }
  });

  expect(u1g1r1).not.toBeNull();
  expect(u2g1r1).not.toBeNull();
  expect(u2g1r2).not.toBeNull();
  expect(u1g2r1).not.toBeNull();
  expect(u1g2r2).toBeNull();
});

afterAll(async () => {
  await prisma.space.delete({
    where: {
      id: space.id
    }
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [user1.id, user2.id]
      }
    }
  });
});
