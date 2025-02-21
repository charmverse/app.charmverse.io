import { prisma } from '@charmverse/core/prisma-client';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { createAndAssignRoles } from '@root/lib/roles/createAndAssignRoles';
import { v4 } from 'uuid';

describe('createAndAssignRoles', () => {
  it('should create new roles and assign to user', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const idRole1 = v4();
    const idRole2 = v4();
    const roles = [
      { id: idRole1, name: 'Role 1' },
      { id: idRole2, name: 'Role 2' }
    ];

    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(0);

    await createAndAssignRoles({ userId: user.id, spaceId: space.id, roles });
    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(2);

    const membership = await prisma.spaceRole.findFirst({
      where: { userId: user.id, spaceId: space.id },
      include: { spaceRoleToRole: true }
    });

    expect(membership?.spaceRoleToRole).toHaveLength(2);
  });

  it('should not override existing roles and assign them to user', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const idRole1 = v4();
    const idRole2 = v4();
    const roles = [
      { id: idRole1, name: 'Role 1' },
      { id: idRole2, name: 'Role 2' }
    ];

    await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      externalId: idRole1
    });

    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(1);

    await createAndAssignRoles({ userId: user.id, spaceId: space.id, roles });
    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(2);

    const membership = await prisma.spaceRole.findFirst({
      where: { userId: user.id, spaceId: space.id },
      include: { spaceRoleToRole: true }
    });

    expect(membership?.spaceRoleToRole).toHaveLength(2);
  });
});
