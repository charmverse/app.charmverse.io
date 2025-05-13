import type { Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { importRoles } from '../importRoles';

describe('importRoles', () => {
  let user: any;
  let space: any;
  let rolesToImport: any[];

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    rolesToImport = [
      { name: 'Tester', id: uuid() },
      { name: 'Developer', id: uuid() }
    ];
    // Create roles in the database to simulate "importing" them
    await prisma.role.createMany({
      data: rolesToImport.map((role) => ({
        id: uuid(),
        name: role.name,
        createdBy: user.id,
        spaceId: space.id
      }))
    });
  });

  it('should import roles into a new space and return a hashmap of old to new IDs', async () => {
    // Generate a new space to import roles into
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const existingRolesInNewSpace = await prisma.role.findMany({
      where: { spaceId: newSpace.id }
    });

    // Initially, there should be no roles in the new space
    expect(existingRolesInNewSpace).toHaveLength(0);

    const result = await importRoles({ targetSpaceIdOrDomain: newSpace.id, exportData: { roles: rolesToImport } });

    // After import, roles should be created in the new space
    expect(result.roles.length).toBe(rolesToImport.length);

    expect(result.roles).toEqual(
      expect.arrayContaining<Role>([
        {
          createdAt: expect.any(Date),
          createdBy: newSpace.createdBy,
          id: expect.any(String),
          name: 'Tester',
          spaceId: newSpace.id,
          externalId: null,
          source: null,
          sourceId: null
        },
        {
          createdAt: expect.any(Date),
          createdBy: newSpace.createdBy,
          id: expect.any(String),
          name: 'Developer',
          spaceId: newSpace.id,
          externalId: null,
          source: null,
          sourceId: null
        }
      ])
    );

    expect(result.oldNewRecordIdHashMap).toMatchObject({
      [rolesToImport[0].id]: result.roles[0].id
    });
  });

  it('should not create duplicate roles if they already exist in the target space', async () => {
    // Assuming roles are already present in the space we are trying to import to
    const existingRolesInTargetSpace = await prisma.role.findMany({
      where: { spaceId: space.id }
    });

    expect(existingRolesInTargetSpace).toHaveLength(rolesToImport.length);

    const result = await importRoles({ targetSpaceIdOrDomain: space.id, exportData: { roles: rolesToImport } });

    // Verify that no new roles are created and the hashmap correctly references the existing roles
    expect(result.roles.length).toBe(rolesToImport.length);
    expect(result.oldNewRecordIdHashMap).toMatchObject({
      [rolesToImport[0].id]: existingRolesInTargetSpace[0].id
    });
  });

  // Error case: Should throw an error if the target space does not exist
  it('should throw an error if the target space does not exist', async () => {
    await expect(
      importRoles({ targetSpaceIdOrDomain: uuid(), exportData: { roles: rolesToImport } })
    ).rejects.toThrow();
  });

  afterAll(async () => {
    await prisma.role.deleteMany({ where: { spaceId: space.id } });
    await prisma.space.delete({ where: { id: space.id } });
  });
});
