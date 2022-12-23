import { v4 } from 'uuid';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';

import { softDeleteUserWithoutConnectableIdentities } from '../softDeleteUserWithoutConnectableIdentities';

describe('softDeleteUserWithoutConnectableIdentities', () => {
  it('should mark the user as deleted if they have 0 connectable identities', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'Test user'
      },
      include: sessionUserRelations
    });

    const updatedUser = await softDeleteUserWithoutConnectableIdentities(user);

    expect(updatedUser.deletedAt).toBeInstanceOf(Date);
  });

  it('should leave the user unchanged if they have at least 1 connectable identity', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'Test user',
        wallets: {
          create: {
            address: `0x${v4()}`
          }
        }
      },
      include: sessionUserRelations
    });

    const updatedUser = await softDeleteUserWithoutConnectableIdentities(user);

    expect(updatedUser.deletedAt).toBeNull();

    expect(updatedUser).toMatchObject(expect.objectContaining(user));
  });
});
