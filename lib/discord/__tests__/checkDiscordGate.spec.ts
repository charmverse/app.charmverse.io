import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('checkDiscordGate', () => {
  afterEach(() => {
    jest.unmock('lit-js-sdk');
    jest.resetModules();
  });

  it('should verify user with discord account', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    await prisma.space.update({ where: { id: space.id }, data: { discordServerId: '123' } });
    await prisma.user.update({
      where: { id: user.id },
      data: { discordUser: { create: { discordId: '456', account: {} } } }
    });

    const canJoinSpaceMock = jest.fn().mockResolvedValue({ isEligible: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      canJoinSpaceViaDiscord: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(true);
    expect(res.isEligible).toBe(true);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).toHaveBeenCalledWith({ discordServerId: '123', discordUserId: '456' });
  });

  it('should not make user eligible to join space that does not have discord server id', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce({ isEligible: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      canJoinSpaceViaDiscord: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(false);
    expect(res.isEligible).toBe(false);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).not.toHaveBeenCalled();
  });

  it('should not make user without connected discort eligible to join the space', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    await prisma.space.update({ where: { id: space.id }, data: { discordServerId: '123' } });

    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce({ isEligible: true, roles: [] });
    jest.mock('lib/collabland/collablandClient', () => ({
      canJoinSpaceViaDiscord: canJoinSpaceMock
    }));

    const { checkDiscordGate } = await import('lib/discord/checkDiscordGate');

    const res = await checkDiscordGate({ spaceDomain: space.domain, userId: user.id });
    expect(res.hasDiscordServer).toBe(true);
    expect(res.isEligible).toBe(false);
    expect(res.spaceId).toBe(space.id);
    expect(canJoinSpaceMock).not.toHaveBeenCalled();
  });
});
