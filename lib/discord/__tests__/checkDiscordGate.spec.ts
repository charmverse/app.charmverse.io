import { v4 } from 'uuid';

import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('checkDiscordGate', () => {
  afterEach(() => {
    jest.unmock('lit-js-sdk');
    jest.resetModules();
  });

  it('should verify user with discord account', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const discordServerId = `discord-${v4()}`;
    const discordUserId = `discord-user-${v4()}`;

    await prisma.space.update({ where: { id: space.id }, data: { discordServerId } });
    await prisma.user.update({
      where: { id: user.id },
      data: { discordUser: { create: { discordId: discordUserId, account: {} } } }
    });

    const canJoinSpaceMock = jest.fn().mockResolvedValue({ isVerified: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      canJoinSpaceViaDiscord: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/checkDiscordGate');

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
      canJoinSpaceViaDiscord: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(false);
    expect(res.isVerified).toBe(false);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).not.toHaveBeenCalled();
  });

  it('should not make user without connected discort eligible to join the space', async () => {
    const discordServerId = `discord-${v4()}`;

    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    await prisma.space.update({ where: { id: space.id }, data: { discordServerId } });

    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce({ isVerified: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      canJoinSpaceViaDiscord: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(true);
    expect(res.isVerified).toBe(false);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).not.toHaveBeenCalled();
  });
});
