import type { Space } from '@prisma/client';

import { prisma } from 'db';
import type { LoggedInUser } from 'models';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('checkDiscordGate', () => {
  let user: LoggedInUser;
  let space: Space;

  beforeEach(async () => {
    const { user: u, space: s } = await generateUserAndSpaceWithApiToken(undefined, true);
    user = u;
    space = s;
  });

  afterEach(() => {
    jest.unmock('lit-js-sdk');
    jest.resetModules();
  });

  it('should not verify space that does not have discord server id', async () => {
    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce(true);
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

  it('should not verify user that does not have discord connected', async () => {
    await prisma.space.update({ where: { id: space.id }, data: { discordServerId: '123' } });

    const canJoinSpaceMock = jest.fn().mockResolvedValueOnce(true);
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

  it('should verify user with discord account', async () => {
    await prisma.space.update({ where: { id: space.id }, data: { discordServerId: '123' } });
    await prisma.user.update({
      where: { id: user.id },
      data: { discordUser: { create: { discordId: '456', account: {} } } }
    });

    const canJoinSpaceMock = jest.fn().mockResolvedValue(true);
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
});
