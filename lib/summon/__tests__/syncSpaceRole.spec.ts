import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import * as summonApi from '../api';
import { syncSpaceRole } from '../syncSpaceRole';

jest.mock('../api', () => ({
  findUserByIdentity: jest.fn().mockResolvedValue(null),
  getUserInventory: jest.fn().mockResolvedValue(null)
}));

describe('syncSpaceRole', () => {
  it(`Should do nothing if the space does not have a tenant ID`, async () => {
    const { space } = await generateUserAndSpaceWithApiToken();
    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSpaceRole({ spaceId: space.id });
    expect(totalSpaceRolesAdded).toBe(0);
    expect(totalSpaceRolesUpdated).toBe(0);
  });

  it(`Should create new role if it doesn't exist and assign it to the user`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const userXpsEngineId = v4();
    const spaceXpsEngineId = v4();

    (summonApi.findUserByIdentity as jest.Mock<any, any>).mockResolvedValue(userXpsEngineId);
    (summonApi.getUserInventory as jest.Mock<any, any>).mockResolvedValue({
      tenant: spaceXpsEngineId,
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

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSpaceRole({ spaceId: space.id });
    const newRole = await prisma.role.findFirstOrThrow({
      where: {
        spaceId: space.id,
        name: `Level 1`,
        source: 'summon'
      }
    });

    const spaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId: user.id
      }
    });

    const spaceRoleToRole = await prisma.spaceRoleToRole.findFirstOrThrow({
      where: {
        roleId: newRole.id,
        spaceRoleId: spaceRole.id
      }
    });

    expect(newRole).toBeTruthy();
    expect(spaceRoleToRole).toBeTruthy();
    expect(totalSpaceRolesAdded).toBe(1);
    expect(totalSpaceRolesUpdated).toBe(0);
    jest.resetAllMocks();
  });

  it(`Should skip updating role if it already exist and space role to role if it doesn't change`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const userXpsEngineId = v4();
    const spaceXpsEngineId = v4();

    (summonApi.findUserByIdentity as jest.Mock<any, any>).mockResolvedValue(userXpsEngineId);
    (summonApi.getUserInventory as jest.Mock<any, any>).mockResolvedValue({
      tenant: spaceXpsEngineId,
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

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSpaceRole({ spaceId: space.id });

    expect(totalSpaceRolesAdded).toBe(0);
    expect(totalSpaceRolesUpdated).toBe(0);
    jest.resetAllMocks();
  });

  it(`Should skip creating role if it already exist and but space role to role if it changes`, async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();
    const userXpsEngineId = v4();
    const spaceXpsEngineId = v4();

    (summonApi.findUserByIdentity as jest.Mock<any, any>).mockResolvedValue(userXpsEngineId);
    (summonApi.getUserInventory as jest.Mock<any, any>).mockResolvedValue({
      tenant: spaceXpsEngineId,
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

    const { totalSpaceRolesAdded, totalSpaceRolesUpdated } = await syncSpaceRole({ spaceId: space.id });

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
