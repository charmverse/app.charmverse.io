import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';
import { vi } from 'vitest';

import { createWorkspaceApi } from '../createWorkspaceApi';
import type { CreateWorkspaceRequestBody } from '../interfaces';

vi.mock('@packages/lib/blockchain/getNFTs', () => {
  return {
    getNFTs: (input: { wallets: any[] }) => {
      return [];
    }
  };
});

vi.mock('@packages/lib/discord/collabland/upsertUserRolesFromDiscord', () => {
  return {
    upsertUserRolesFromDiscord: () => Promise.resolve()
  };
});

vi.mock('@packages/lib/discord/collabland/upsertSpaceRolesFromDiscord', () => {
  return {
    upsertSpaceRolesFromDiscord: () => Promise.resolve()
  };
});

afterAll(async () => {
  vi.resetModules();
});

describe('createWorkspaceApi', () => {
  it('should create a space allowing for an xpsengine and discord integration, and register the token used to create the space, as well as auto create a bot user', async () => {
    const tokenName = `Integration partner ${uid()}`;

    const tokenValue = `key-${v4()}`;

    const superApiToken = await prisma.superApiToken.create({
      data: {
        name: tokenName,
        token: tokenValue
      }
    });

    const discordServerId = `discord-${v4()}`;
    const xpsEngineId = `xps-${v4()}`;

    const input: CreateWorkspaceRequestBody = {
      discordServerId,
      xpsEngineId,
      name: 'Test space'
    };

    const adminDiscordUserId = `admin-discord-${v4()}`;

    const space = await createWorkspaceApi({
      ...input,
      adminDiscordUserId,
      avatar: 'https://example.com/avatar.png',
      adminWalletAddress: '0x123',
      superApiToken
    });

    const spaceInDb = await prisma.space.findUnique({
      where: {
        id: space.id
      }
    });

    // Make sure xpsEngineId and discordServerId are set
    expect(spaceInDb).toMatchObject(
      expect.objectContaining<Partial<Space>>({
        ...input,
        superApiTokenId: superApiToken.id
      })
    );

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId: space.id
      },
      include: {
        user: true
      }
    });

    expect(spaceRoles).toHaveLength(2);

    const adminUser = spaceRoles.find((sr) => sr.user.isBot === false)?.user;
    const botUser = spaceRoles.find((sr) => sr.user.isBot === true)?.user;

    expect(adminUser).toBeDefined();
    expect(botUser).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(spaceInDb?.createdBy).toBe(adminUser!.id);
    expect(spaceInDb?.updatedBy).toBe(botUser?.id);
  });
});
