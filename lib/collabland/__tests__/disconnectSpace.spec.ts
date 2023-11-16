import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { createDiscordUser } from 'testing/utils/discord';
import { addUserToSpace } from 'testing/utils/spaces';

import { disconnectSpace } from '../disconnectSpace';

describe('disconnectSpace', () => {
  it('should throw error if no user with the provided discord id exist', async () => {
    const { spaceIds } = await disconnectSpace({
      discordServerId: v4(),
      discordUserId: v4()
    });
    expect(spaceIds).toStrictEqual([]);
  });

  it('should remove disconnect discord id from spaces and delete all collabland roles', async () => {
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

    await Promise.all(
      [space1, space2].map((space) =>
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

    expect(discordConnectedSpaces.length).toBe(0);
    expect(space1CollablandRolesCount).toBe(0);
    expect(space2CollablandRolesCount).toBe(0);
  });

  it('should not remove disconnect discord id from spaces and delete all collabland roles if the user is not an admin', async () => {
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

    await Promise.all(
      [space1, space2].map((space) =>
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

    expect(discordConnectedSpaces.length).toBe(2);
    expect(space1CollablandRolesCount).toBe(1);
    expect(space2CollablandRolesCount).toBe(1);
  });
});
