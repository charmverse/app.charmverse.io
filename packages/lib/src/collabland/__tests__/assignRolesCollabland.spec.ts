import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { addSpaceDiscordServerId, createDiscordUser } from '@packages/testing/utils/discord';
import { createRole } from '@packages/testing/utils/roles';
import type { ExternalRole } from '@packages/lib/roles';
import { v4 } from 'uuid';

describe('assignRolesCollabland', () => {
  it('should fetch roles from discord, add them and assign to user', async () => {
    const discordServerId = v4();
    const discordUserId = v4();
    const discordRoles: ExternalRole[] = [
      { id: v4(), name: 'Role 1' },
      { id: v4(), name: 'Role 2' }
    ];
    const { user, space } = await generateUserAndSpaceWithApiToken();
    await addSpaceDiscordServerId({ spaceId: space.id, discordServerId });
    await createDiscordUser({ userId: user.id, discordUserId });

    const getGuildRolesMock = jest.fn().mockResolvedValue(discordRoles);
    jest.mock('lib/collabland/collablandClient', () => ({
      getGuildRoles: getGuildRolesMock
    }));

    const { assignRolesCollabland } = await import('../assignRolesCollabland');
    await assignRolesCollabland({ discordServerId, discordUserId, roles: discordRoles.map((r) => String(r.id)) });

    const membership = await prisma.spaceRole.findFirst({
      where: { userId: user.id, spaceId: space.id },
      include: { spaceRoleToRole: true }
    });

    const existingDiscordRoles = await prisma.role.findMany({
      where: { externalId: { in: discordRoles.map((r) => String(r.id)) } }
    });

    expect(membership?.spaceRoleToRole).toHaveLength(2);
    expect(existingDiscordRoles).toHaveLength(2);
    expect(getGuildRolesMock).toHaveBeenCalledWith(discordServerId);
  });

  it('should assign existing roles without fetching from collabland api', async () => {
    const discordServerId = v4();
    const discordUserId = v4();
    const discordRoles: ExternalRole[] = [
      { id: v4(), name: 'Role 1' },
      { id: v4(), name: 'Role 2' }
    ];
    const { user, space } = await generateUserAndSpaceWithApiToken();
    await addSpaceDiscordServerId({ spaceId: space.id, discordServerId });
    await createDiscordUser({ userId: user.id, discordUserId });
    await createRole({ spaceId: space.id, name: discordRoles[0].name, externalId: discordRoles[0].id as string });

    const getGuildRolesMock = jest.fn().mockResolvedValue(discordRoles);
    jest.mock('lib/collabland/collablandClient', () => ({
      getGuildRoles: getGuildRolesMock
    }));

    const { assignRolesCollabland } = await import('../assignRolesCollabland');
    await assignRolesCollabland({ discordServerId, discordUserId, roles: [discordRoles[0].id as string] });

    const membership = await prisma.spaceRole.findFirst({
      where: { userId: user.id, spaceId: space.id },
      include: { spaceRoleToRole: true }
    });

    const existingDiscordRoles = await prisma.role.findMany({
      where: { externalId: { in: [discordRoles[0].id as string] } }
    });

    expect(membership?.spaceRoleToRole).toHaveLength(1);
    expect(existingDiscordRoles).toHaveLength(1);
    expect(getGuildRolesMock).not.toHaveBeenCalled();
  });
});
