import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { createDiscordUser } from '@packages/testing/utils/discord';
import { createRole } from '@packages/testing/utils/roles';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { connectSpace } from '@root/lib/collabland/connectSpace';
import { encryptData } from '@root/lib/utils/dataEncryption';
import fetchMock from 'fetch-mock-jest';
import { v4 } from 'uuid';

const collablandApiUrl = 'https://fakedomain.com';

jest.mock('config/constants', () => ({
  authSecret: 'testsecret1234567890',
  isTestEnv: true
}));

jest.mock('lib/collabland/config', () => ({
  COLLAB_API_KEY: 'testsecret1234567890',
  COLLABLAND_API_URL: 'https://fakedomain.com'
}));

const mockSandbox = fetchMock.sandbox();

jest.mock('undici', () => {
  return { fetch: (...args: any[]) => mockSandbox(...args) };
});

afterAll(() => {
  fetchMock.restore();
});

describe('connectSpace', () => {
  it('should not allow to connect if user is not an admin or data is invalid', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    const user = await testUtilsUser.generateUser();
    await addUserToSpace({ spaceId: space.id, userId: user.id, isAdmin: false });

    const state = encryptData({ userId: user.id, spaceId: space.id });
    const discordServerId = v4();

    await expect(() => connectSpace({ state, discordServerId })).rejects.toThrow(
      new InvalidInputError('Cannot find space to connect')
    );

    await expect(() => connectSpace({ state, discordServerId: '' })).rejects.toThrow(
      new InvalidInputError('A discord server ID must be provided')
    );

    const state2 = encryptData({ testing: 'state' });
    await expect(() => connectSpace({ state: state2, discordServerId: '' })).rejects.toThrow(
      new InvalidInputError('A discord server ID must be provided')
    );
  });

  it('should sync and assign collabland roles for all members of space', async () => {
    const discordServerId = v4();

    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const externalRoleIds = [v4(), v4()];

    await createRole({
      spaceId: space.id,
      createdBy: adminUser.id,
      name: 'Existing Role'
    });

    const discordUser = await testUtilsUser.generateUser();
    await addUserToSpace({ spaceId: space.id, userId: discordUser.id, isAdmin: false });

    const nonDiscordUser = await testUtilsUser.generateUser();
    await addUserToSpace({ spaceId: space.id, userId: nonDiscordUser.id, isAdmin: false });

    const discordUserIds = [v4(), v4()];

    await createDiscordUser({
      discordUserId: discordUserIds[0],
      userId: adminUser.id
    });

    await createDiscordUser({
      discordUserId: discordUserIds[1],
      userId: discordUser.id
    });

    mockSandbox.get(`${collablandApiUrl}/discord/${discordServerId}/roles`, [
      {
        name: 'Existing Role',
        id: externalRoleIds[0]
      },
      {
        name: 'New Role',
        id: externalRoleIds[1]
      }
    ]);

    mockSandbox.get(`${collablandApiUrl}/discord/${discordServerId}/member/${discordUserIds[0]}`, {
      roles: [externalRoleIds[0]]
    });

    mockSandbox.get(`${collablandApiUrl}/discord/${discordServerId}/member/${discordUserIds[1]}`, {
      roles: [externalRoleIds[1]]
    });

    const state = encryptData({ userId: adminUser.id, spaceId: space.id });

    await connectSpace({ state, discordServerId });

    const existingRole = await prisma.role.findFirstOrThrow({
      where: {
        externalId: externalRoleIds[0]
      }
    });

    const newRole = await prisma.role.findFirstOrThrow({
      where: {
        externalId: externalRoleIds[1]
      }
    });

    const adminUserSpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        spaceId: space.id,
        userId: adminUser.id
      }
    });

    const discordUserSpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        spaceId: space.id,
        userId: discordUser.id
      }
    });

    const nonDiscordUserSpaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        spaceId: space.id,
        userId: nonDiscordUser.id
      }
    });

    const adminRoles = await prisma.spaceRoleToRole.findMany({
      where: {
        spaceRoleId: adminUserSpaceRole.id
      },
      select: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    const discordUserRoles = await prisma.spaceRoleToRole.findMany({
      where: {
        spaceRoleId: discordUserSpaceRole.id
      },
      select: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    const nonDiscordUserRoles = await prisma.spaceRoleToRole.findMany({
      where: {
        spaceRoleId: nonDiscordUserSpaceRole.id
      },
      select: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    const discordConnectedSpace = await prisma.space.findFirstOrThrow({
      where: {
        discordServerId
      }
    });

    expect(existingRole.name).toBe('Existing Role');
    expect(newRole.name).toBe('New Role');
    expect(adminRoles.map((r) => r.role.name)).toStrictEqual(['Existing Role']);
    expect(discordUserRoles.map((r) => r.role.name)).toStrictEqual(['New Role']);
    expect(nonDiscordUserRoles.map((r) => r.role.name)).toStrictEqual([]);
    expect(discordConnectedSpace).toBeTruthy();
  });
});
