import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { connectSpace } from 'lib/collabland/connectSpace';
import { encryptData } from 'lib/utilities/dataEncryption';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

jest.mock('config/constants', () => ({
  authSecret: 'testsecret1234567890'
}));

describe('connectSpace', () => {
  it('should verify state and connect space to discord server id', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const state = encryptData({ userId: user.id, spaceId: space.id });
    const discordServerId = v4();

    const connectedSpace = await connectSpace({ state, discordServerId });
    const updatedSpace = await prisma.space.findUnique({ where: { id: space.id } });

    expect(connectedSpace.id).toBe(space.id);
    expect(updatedSpace?.discordServerId).toBe(discordServerId);
  });

  it('should not allow to connect if user is not an admin ort data is invalid', async () => {
    const { space } = await generateUserAndSpaceWithApiToken();
    const user = await generateUser();
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

    const updatedSpace = await prisma.space.findUnique({ where: { id: space.id } });
    expect(updatedSpace?.discordServerId).toBeNull();
  });
});
