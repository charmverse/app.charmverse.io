import { prisma } from '@charmverse/core/prisma-client';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { createDiscordUser } from '@packages/testing/utils/discord';
import { createAndAssignRolesDiscord } from '@packages/lib/discord/createAndAssignRolesDiscord';
import { v4 } from 'uuid';

describe('createAndAssignRolesDiscord', () => {
  it('should create new roles and assign to user', async () => {
    const discordUserId = '111111';
    const discordServerId = '111';
    const { user, space } = await generateUserAndSpaceWithApiToken();
    await prisma.space.update({ where: { id: space.id }, data: { discordServerId } });
    await createDiscordUser({ userId: user.id, discordUserId });

    const idRole1 = v4();
    const idRole2 = v4();
    const roles = [
      { id: idRole1, name: 'Role 1' },
      { id: idRole2, name: 'Role 2' }
    ];

    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(0);

    await createAndAssignRolesDiscord({ discordServerId, discordUserId, roles });
    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(2);

    const membership = await prisma.spaceRole.findFirst({
      where: { userId: user.id, spaceId: space.id },
      include: { spaceRoleToRole: true }
    });

    expect(membership?.spaceRoleToRole).toHaveLength(2);
  });

  it('should not override existing roles and assign them to user', async () => {
    const discordUserId = '222222';
    const discordServerId = '222';
    const { user, space } = await generateUserAndSpaceWithApiToken();
    await prisma.space.update({ where: { id: space.id }, data: { discordServerId } });
    await createDiscordUser({ userId: user.id, discordUserId });

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

    await createAndAssignRolesDiscord({ discordServerId, discordUserId, roles });
    expect(await prisma.role.findMany({ where: { externalId: { in: [idRole1, idRole2] } } })).toHaveLength(2);

    const membership = await prisma.spaceRole.findFirst({
      where: { userId: user.id, spaceId: space.id },
      include: { spaceRoleToRole: true }
    });

    expect(membership?.spaceRoleToRole).toHaveLength(2);
  });
});
