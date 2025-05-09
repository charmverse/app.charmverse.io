import type { CharmWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addCharms } from '@packages/lib/charms/addCharms';
import { CharmActionTrigger } from '@packages/lib/charms/constants';
import { getTransaction } from '@packages/lib/charms/getTransaction';
import { getUserOrSpaceWallet } from '@packages/lib/charms/getUserOrSpaceWallet';

describe('addCharms', () => {
  it('adds charms to empty user wallet', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    const wallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;

    const { balance, txId } = await addCharms({ recipient: { userId: user.id }, amount: 100 });
    const tx = await getTransaction(txId);
    const updatedWallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;

    expect(balance).toBe(100);
    expect(updatedWallet.totalBalance).toBe(100);
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(100);
    expect(tx?.from).toBe(null);
    expect(tx?.to).toBe(wallet.id);
    expect(tx?.metadata).toEqual({});
  });

  it('top ups charms balance', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    const wallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;
    await prisma.charmWallet.update({ where: { id: wallet.id }, data: { balance: 50, totalBalance: 50 } });

    const { balance, txId } = await addCharms({ recipient: { userId: user.id }, amount: 100 });
    const tx = await getTransaction(txId);
    const updatedWallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;

    expect(balance).toBe(150);
    expect(updatedWallet.totalBalance).toBe(150);
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(100);
    expect(tx?.from).toBe(null);
    expect(tx?.to).toBe(wallet.id);
    expect(tx?.metadata).toEqual({});
  });

  it('top ups charms balance and stores metadata', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    const wallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;
    await prisma.charmWallet.update({ where: { id: wallet.id }, data: { balance: 50, totalBalance: 50 } });

    const { balance, txId } = await addCharms({
      recipient: { userId: user.id },
      amount: 100,
      actorId: '123',
      actionTrigger: CharmActionTrigger.referral
    });
    const tx = await getTransaction(txId);
    const updatedWallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;

    expect(balance).toBe(150);
    expect(updatedWallet.totalBalance).toBe(150);
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(100);
    expect(tx?.from).toBe(null);
    expect(tx?.to).toBe(wallet.id);
    expect(tx?.metadata).toEqual({ actorId: '123', actionTrigger: CharmActionTrigger.referral });
  });
});
