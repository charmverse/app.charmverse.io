import type { SpaceApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { provisionApiKey } from '../requireApiKey';

describe('provisionApiKey', () => {
  it('should create an API key and bot user for a space', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace({});

    await provisionApiKey(space.id);

    const apiKey = await prisma.spaceApiToken.findFirst({
      where: {
        spaceId: space.id
      }
    });

    expect(apiKey).toMatchObject<SpaceApiToken>({
      createdAt: expect.any(Date),
      spaceId: space.id,
      updatedAt: expect.any(Date),
      token: expect.any(String)
    });
  });

  it('should update the token of the existing API key for a space', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace({});

    const firstGenerated = await provisionApiKey(space.id);
    await provisionApiKey(space.id);
    await provisionApiKey(space.id);

    const apiKey = await prisma.spaceApiToken.findMany({
      where: {
        spaceId: space.id
      }
    });

    // We should not have created multiple API keys
    expect(apiKey).toHaveLength(1);

    expect(apiKey[0]).toMatchObject<SpaceApiToken>({
      createdAt: expect.any(Date),
      spaceId: space.id,
      updatedAt: expect.any(Date),
      token: expect.any(String)
    });

    expect(apiKey[0].token).not.toEqual(firstGenerated.token);
  });

  it('should create an admin bot user for the space if one does not exist', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace({});

    await provisionApiKey(space.id);
    await provisionApiKey(space.id);
    await provisionApiKey(space.id);

    const botUsers = await prisma.user.findMany({
      where: {
        isBot: true,
        spaceRoles: {
          some: {
            spaceId: space.id
          }
        }
      },
      include: {
        spaceRoles: true
      }
    });

    expect(botUsers).toHaveLength(1);

    // We don't create an admin user
    expect(botUsers[0].spaceRoles[0].isAdmin).toEqual(true);
  });
});
