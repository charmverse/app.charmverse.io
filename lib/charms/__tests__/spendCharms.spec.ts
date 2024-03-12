import { InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import type { CharmWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getTransaction } from 'lib/charms/getTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';
import { spendCharms } from 'lib/charms/spendCharms';
import { transferCharms } from 'lib/charms/transferCharms';
import { generateUserAndSpace } from 'testing/setupDatabase';

describe('spendCharms', () => {
  it('spends space charms by admin', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: true });
    const spaceWallet = (await getUserOrSpaceWallet({ spaceId: space.id })) as CharmWallet;
    // update space balance
    await prisma.charmWallet.update({ where: { spaceId: space.id }, data: { balance: 137 } });

    const { txId, balance } = await spendCharms({ actorId: user.id, spaceId: space.id, amount: 10 });
    const tx = await getTransaction(txId);

    expect(balance).toBe(127);
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(10);
    expect(tx?.to).toBe(null);
    expect(tx?.from).toBe(spaceWallet.id);
    expect(tx?.metadata).toEqual({});
  });

  it('should throw an error if space account does not have sufficient balance', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: true });
    const spaceWallet = await getUserOrSpaceWallet({ spaceId: space.id });
    // update space balance
    await prisma.charmWallet.update({ where: { spaceId: space.id }, data: { balance: 13 } });

    await expect(spendCharms({ actorId: user.id, spaceId: space.id, amount: 14 })).rejects.toThrowError(
      InvalidInputError
    );
  });

  it('should throw an error if user is not an admin', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: false });
    const spaceWallet = await getUserOrSpaceWallet({ spaceId: space.id });
    // update space balance
    await prisma.charmWallet.update({ where: { spaceId: space.id }, data: { balance: 13 } });

    await expect(spendCharms({ actorId: user.id, spaceId: space.id, amount: 10 })).rejects.toThrowError(
      UnauthorisedActionError
    );
  });
});
