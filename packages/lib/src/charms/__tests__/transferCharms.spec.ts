import { InvalidInputError } from '@charmverse/core/errors';
import type { CharmWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { getTransaction } from '@packages/lib/charms/getTransaction';
import { getUserOrSpaceWallet } from '@packages/lib/charms/getUserOrSpaceWallet';
import { transferCharms } from '@packages/lib/charms/transferCharms';

describe('transferCharms', () => {
  it('sends charms from user to space', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: true });
    const userWallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;
    const spaceWallet = (await getUserOrSpaceWallet({ spaceId: space.id })) as CharmWallet;

    // update user balance
    await prisma.charmWallet.update({ where: { userId: user.id }, data: { balance: 1337 } });

    const { txId, balance } = await transferCharms({ sender: user.id, recipient: { spaceId: space.id }, amount: 107 });
    const tx = await getTransaction(txId);

    expect(balance).toBe(1230);
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(107);
    expect(tx?.from).toBe(userWallet.id);
    expect(tx?.to).toBe(spaceWallet.id);
    expect(tx?.metadata).toEqual({});
  });

  it('should throw an error if account does not have sufficient balance', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user.id });
    await getUserOrSpaceWallet({ spaceId: space.id });

    // update user balance
    await prisma.charmWallet.update({ where: { userId: user.id }, data: { balance: 13 } });

    await expect(
      transferCharms({
        sender: user.id,
        recipient: { spaceId: space.id },
        amount: 13.37
      })
    ).rejects.toThrowError(InvalidInputError);
  });
});
