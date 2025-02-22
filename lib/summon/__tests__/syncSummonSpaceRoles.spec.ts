import { prisma } from '@charmverse/core/prisma-client';
import * as summonProfile from '@packages/profile/getSummonProfile';
import { createUserWithWallet, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { TENANT_URLS } from '@root/lib/summon/constants';
import { v4 } from 'uuid';

import { syncSummonSpaceRoles } from '../syncSummonSpaceRoles';

jest.mock('lib/profile/getSummonProfile', () => ({
  getSummonProfile: jest.fn().mockResolvedValue(null)
}));

const spaceXpsEngineId = Object.keys(TENANT_URLS)[0];

afterEach(async () => {
  // xpsEngineId must be unique, so remove it from any spaces
  await prisma.space.updateMany({
    where: {
      xpsEngineId: {
        not: null
      }
    },
    data: {
      xpsEngineId: null
    }
  });
});

describe('syncSummonSpaceRoles', () => {
  it(`Should do nothing if the space does not have a tenant ID`, async () => {
    const { space } = await generateUserAndSpace();
    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSummonSpaceRoles({ spaceId: space.id });
    expect(totalSpaceRolesAdded).toBe(0);
    expect(totalSpaceRolesUpdated).toBe(0);
  });

  it(`Should create new role if it doesn't exist and assign it to the user`, async () => {
    const { space, user } = await generateUserAndSpace();
    const userXpsEngineId = v4();
    const user2XpsEngineId = v4();
    const user2 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });

    await addUserToSpace({
      isAdmin: false,
      spaceId: space.id,
      userId: user2.id
    });

    (summonProfile.getSummonProfile as jest.Mock<any, any>)
      .mockResolvedValueOnce({
        tenantId: spaceXpsEngineId,
        user: userXpsEngineId,
        meta: {
          rank: 1.1
        }
      })
      .mockResolvedValueOnce({
        tenantId: spaceXpsEngineId,
        user: user2XpsEngineId,
        meta: {
          rank: 3
        }
      });

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        xpsEngineId: spaceXpsEngineId
      }
    });

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSummonSpaceRoles({ spaceId: space.id });
    const level1Role = await prisma.role.findFirstOrThrow({
      where: {
        spaceId: space.id,
        name: `Level 1`,
        source: 'summon'
      }
    });

    const level3Role = await prisma.role.findFirstOrThrow({
      where: {
        spaceId: space.id,
        name: `Level 3`,
        source: 'summon'
      }
    });

    const user1SpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user.id,
        spaceId: space.id
      }
    });

    const user2SpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user2.id,
        spaceId: space.id
      }
    });

    const user1SpaceRoleToRole = await prisma.spaceRoleToRole.findFirstOrThrow({
      where: {
        roleId: level1Role.id,
        spaceRoleId: user1SpaceRole.id
      }
    });

    const user2SpaceRoleToRole = await prisma.spaceRoleToRole.findFirstOrThrow({
      where: {
        roleId: level3Role.id,
        spaceRoleId: user2SpaceRole.id
      }
    });

    expect(level1Role).toBeTruthy();
    expect(level3Role).toBeTruthy();
    expect(user1SpaceRoleToRole).toBeTruthy();
    expect(user2SpaceRoleToRole).toBeTruthy();
    expect(totalSpaceRolesAdded).toBe(2);
    expect(totalSpaceRolesUpdated).toBe(0);
    jest.resetAllMocks();
  });

  it(`Should create new role for a single user if userId is also passed`, async () => {
    const { space, user } = await generateUserAndSpace();
    const user2 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });

    await addUserToSpace({
      isAdmin: false,
      spaceId: space.id,
      userId: user2.id
    });

    const userXpsEngineId = v4();

    (summonProfile.getSummonProfile as jest.Mock<any, any>).mockResolvedValue({
      tenantId: spaceXpsEngineId,
      user: userXpsEngineId,
      meta: {
        rank: 1
      }
    });

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        xpsEngineId: spaceXpsEngineId
      }
    });

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSummonSpaceRoles({
      spaceId: space.id,
      userId: user.id
    });

    const newRole = await prisma.role.findFirstOrThrow({
      where: {
        spaceId: space.id,
        name: `Level 1`,
        source: 'summon'
      }
    });

    const user1SpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user.id,
        spaceId: space.id
      }
    });

    const user2SpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user2.id,
        spaceId: space.id
      }
    });

    const user1SpaceRoleToRole = await prisma.spaceRoleToRole.findFirstOrThrow({
      where: {
        roleId: newRole.id,
        spaceRoleId: user1SpaceRole.id
      }
    });

    const user2SpaceRoleToRole = await prisma.spaceRoleToRole.findFirst({
      where: {
        roleId: newRole.id,
        spaceRoleId: user2SpaceRole.id
      }
    });

    expect(newRole).toBeTruthy();
    expect(user1SpaceRoleToRole).toBeTruthy();
    expect(user2SpaceRoleToRole).toBeFalsy();
    expect(totalSpaceRolesAdded).toBe(1);
    expect(totalSpaceRolesUpdated).toBe(0);
    jest.resetAllMocks();
  });

  it(`Should skip updating role if it already exist and space role to role if it doesn't change`, async () => {
    const { space, user } = await generateUserAndSpace();
    const userXpsEngineId = v4();

    (summonProfile.getSummonProfile as jest.Mock<any, any>).mockResolvedValue({
      tenantId: spaceXpsEngineId,
      user: userXpsEngineId,
      meta: {
        rank: 1
      }
    });

    const existingRole = await prisma.role.create({
      data: {
        name: `Level 1`,
        source: 'summon',
        spaceId: space.id,
        createdBy: space.createdBy
      }
    });

    const spaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user.id
      }
    });

    await prisma.spaceRoleToRole.create({
      data: {
        roleId: existingRole.id,
        spaceRoleId: spaceRole.id
      }
    });

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        xpsEngineId: spaceXpsEngineId
      }
    });

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSummonSpaceRoles({ spaceId: space.id });

    expect(totalSpaceRolesAdded).toBe(0);
    expect(totalSpaceRolesUpdated).toBe(0);
    jest.resetAllMocks();
  });

  it(`Should skip creating role if it already exist and but space role to role if it changes`, async () => {
    const { space, user } = await generateUserAndSpace();
    const userXpsEngineId = v4();

    (summonProfile.getSummonProfile as jest.Mock<any, any>).mockResolvedValue({
      tenantId: spaceXpsEngineId,
      user: userXpsEngineId,
      meta: {
        rank: 2
      }
    });

    const existingLevel1Role = await prisma.role.create({
      data: {
        name: `Level 1`,
        source: 'summon',
        spaceId: space.id,
        createdBy: space.createdBy
      }
    });

    const spaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user.id
      }
    });

    await prisma.spaceRoleToRole.create({
      data: {
        roleId: existingLevel1Role.id,
        spaceRoleId: spaceRole.id
      }
    });

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        xpsEngineId: spaceXpsEngineId
      }
    });

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSummonSpaceRoles({ spaceId: space.id });

    const level2Role = await prisma.role.findFirstOrThrow({
      where: {
        name: `Level 2`,
        source: 'summon',
        spaceId: space.id
      }
    });

    const previousLevel1SpaceRoleToRole = await prisma.spaceRoleToRole.findFirst({
      where: {
        roleId: existingLevel1Role.id,
        spaceRoleId: spaceRole.id
      }
    });

    expect(level2Role).toBeTruthy();
    expect(previousLevel1SpaceRoleToRole).toBeFalsy();
    expect(totalSpaceRolesAdded).toBe(0);
    expect(totalSpaceRolesUpdated).toBe(1);
    jest.resetAllMocks();
  });
});
