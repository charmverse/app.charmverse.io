import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { createDiscordUser } from 'testing/utils/discord';
import { addUserToSpace } from 'testing/utils/spaces';

import { disconnectSpace } from '../disconnectSpace';

describe('disconnectSpace', () => {
  it('should throw error if no user with the provided discord id exist', async () => {
    await expect(() =>
      disconnectSpace({
        discordServerId: v4(),
        discordUserId: v4()
      })
    ).rejects.toThrow(new DataNotFoundError('Cannot find user to disconnect'));
  });

  it('should remove disconnect discord id from spaces and delete all collabland roles', async () => {
    const discordServerId = v4();
    const discordUserId = v4();

    const { space: space1, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const { space: space2 } = await testUtilsUser.generateUserAndSpace();
    const { space: space3 } = await testUtilsUser.generateUserAndSpace();

    await prisma.space.updateMany({
      where: {
        id: {
          in: [space1.id, space2.id, space3.id]
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

    await addUserToSpace({
      spaceId: space3.id,
      userId: user.id
    });

    await createDiscordUser({
      discordUserId,
      userId: user.id
    });

    await Promise.all(
      [space1, space2, space3].map((space) =>
        prisma.role.create({
          data: {
            name: 'Existing Role',
            source: 'collabland',
            spaceId: space.id,
            createdBy: user.id
          }
        })
      )
    );

    await disconnectSpace({
      discordServerId,
      discordUserId
    });

    const discordConnectedSpaces = await prisma.space.findMany({
      where: {
        discordServerId
      },
      select: {
        id: true
      }
    });

    const space1CollablandRolesCount = await prisma.role.count({
      where: {
        source: 'collabland',
        spaceId: space1.id
      }
    });

    const space2CollablandRolesCount = await prisma.role.count({
      where: {
        source: 'collabland',
        spaceId: space2.id
      }
    });

    const space3CollablandRolesCount = await prisma.role.count({
      where: {
        source: 'collabland',
        spaceId: space3.id
      }
    });

    expect(discordConnectedSpaces.map((space) => space.id)).toStrictEqual([space3.id]);
    expect(space1CollablandRolesCount).toBe(0);
    expect(space2CollablandRolesCount).toBe(0);
    // Not removed since user is not admin
    expect(space3CollablandRolesCount).toBe(1);
  });
});
