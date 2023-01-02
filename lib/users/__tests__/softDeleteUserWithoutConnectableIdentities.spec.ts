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

    await softDeleteUserWithoutConnectableIdentities({ userId: user.id, newUserId: 'aaa' });
    const updatedUser = await prisma.user.findFirstOrThrow({
      where: { id: user.id }
    });

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
      }
    });

    await softDeleteUserWithoutConnectableIdentities({ userId: user.id, newUserId: 'aaa' });
    const updatedUser = await prisma.user.findFirstOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.deletedAt).toBeNull();

    expect(updatedUser).toMatchObject(expect.objectContaining(user));
  });
});
