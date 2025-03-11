import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

describe('checkDiscordGate', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('should verify user with discord account', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const discordServerId = `discord-${v4()}`;
    const discordUserId = `discord-user-${v4()}`;

    const token = await prisma.superApiToken.create({
      data: { name: v4(), token: v4() }
    });
    await prisma.space.update({ where: { id: space.id }, data: { discordServerId, superApiTokenId: token.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { discordUser: { create: { discordId: discordUserId, account: {} } } }
    });

    const canJoinSpaceMock = jest.fn().mockResolvedValue({ isVerified: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      getDiscordUserState: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/collabland/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(true);
    expect(res.isVerified).toBe(true);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).toHaveBeenCalledWith({ discordServerId, discordUserId });
  });

  it('should not make user eligible to join space that does not have discord server id', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce({ isVerified: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      getDiscordUserState: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/collabland/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(false);
    expect(res.isVerified).toBe(false);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).not.toHaveBeenCalled();
  });

  it('should not make user without connected discort eligible to join the space', async () => {
    const discordServerId = `discord-${v4()}`;

    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const token = await prisma.superApiToken.create({
      data: { name: v4(), token: v4() }
    });
    await prisma.space.update({ where: { id: space.id }, data: { discordServerId, superApiTokenId: token.id } });

    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce({ isVerified: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      getDiscordUserState: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/collabland/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(true);
    expect(res.isVerified).toBe(false);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).not.toHaveBeenCalled();
  });
});
