import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { createDiscordUser } from '@packages/testing/utils/discord';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { v4 } from 'uuid';

import { disconnectSpace } from '../disconnectSpace';

describe('disconnectSpace', () => {
  it('should throw error if no user with the provided discord id exist', async () => {
    const { spaceIds } = await disconnectSpace({
      discordServerId: v4(),
      discordUserId: v4()
    });
    expect(spaceIds).toStrictEqual([]);
  });

  it('should remove disconnect discord id from spaces', async () => {
    const discordServerId = v4();
    const discordUserId = v4();

    const { space: space1, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const { space: space2 } = await testUtilsUser.generateUserAndSpace();

    await prisma.space.updateMany({
      where: {
        id: {
          in: [space1.id, space2.id]
        }
      },
      data: {
        discordServerId
      }
    });

    await addUserToSpace({
      spaceId: space2.id,
      userId: user.id,
      isAdmin: true
    });

    await createDiscordUser({
      discordUserId,
      userId: user.id
    });

    await disconnectSpace({
      discordServerId,
      discordUserId
    });

    const discordConnectedSpaces = await prisma.space.count({
      where: {
        discordServerId
      }
    });

    expect(discordConnectedSpaces).toBe(0);
  });

  it('should not remove disconnect discord id from spaces if the user is not an admin', async () => {
    const discordServerId = v4();
    const discordUserId = v4();

    const { space: space1, user } = await testUtilsUser.generateUserAndSpace();

    const { space: space2 } = await testUtilsUser.generateUserAndSpace();

    await prisma.space.updateMany({
      where: {
        id: {
          in: [space1.id, space2.id]
        }
      },
      data: {
        discordServerId
      }
    });

    await addUserToSpace({
      spaceId: space2.id,
      userId: user.id
    });

    await createDiscordUser({
      discordUserId,
      userId: user.id
    });

    await disconnectSpace({
      discordServerId,
      discordUserId
    });

    const discordConnectedSpaces = await prisma.space.count({
      where: {
        discordServerId
      }
    });

    expect(discordConnectedSpaces).toBe(2);
  });
});
