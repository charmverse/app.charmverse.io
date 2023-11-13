import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { assignRole } from 'lib/roles';
import { encryptData } from 'lib/utilities/dataEncryption';
import { createRole } from 'testing/utils/roles';
import { addUserToSpace } from 'testing/utils/spaces';

import { disconnectSpace } from '../disconnectSpace';

describe('disconnectSpace', () => {
  it('should not allow to connect if user is not an admin or data is invalid', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    const user = await testUtilsUser.generateUser();
    await addUserToSpace({ spaceId: space.id, userId: user.id, isAdmin: false });

    const state = encryptData({ userId: user.id, spaceId: space.id });

    await expect(() => disconnectSpace(state)).rejects.toThrow(new InvalidInputError('Cannot find space to connect'));

    const state2 = encryptData({ testing: 'state' });
    await expect(() => disconnectSpace(state2)).rejects.toThrow(new InvalidInputError('Invalid data provided'));
  });

  it('should remove disconnect discord id from space and delete all collabland roles', async () => {
    const discordServerId = v4();

    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const collablandMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        discordServerId
      }
    });

    const state = encryptData({ userId: adminUser.id, spaceId: space.id });

    const collablandRole = await createRole({
      spaceId: space.id,
      createdBy: adminUser.id,
      name: 'Existing Role',
      source: 'collabland'
    });

    await assignRole({
      roleId: collablandRole.id,
      userId: collablandMember.id
    });

    await disconnectSpace(state);

    const updatedSpace = await prisma.space.findUniqueOrThrow({
      where: {
        id: space.id
      },
      select: {
        discordServerId: true
      }
    });

    const collablandRoles = await prisma.role.findMany({
      where: {
        source: 'collabland'
      }
    });

    expect(updatedSpace.discordServerId).toBeNull();
    expect(collablandRoles.length).toBe(0);
  });
});
