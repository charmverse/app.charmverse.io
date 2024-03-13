import type { CharmWallet } from '@charmverse/core/prisma-client';

import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';
import { rewardCharmsForProposal } from 'lib/charms/triggers/rewardCharmsForProposal';
import { generateUserAndSpace } from 'testing/setupDatabase';

describe('rewardCharmsFormProposal', () => {
  it('should reward user for creating first proposal (only once)', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });

    const rewarded = await rewardCharmsForProposal(user.id);
    const wallet = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;

    expect(rewarded).toBe(true);
    expect(wallet.balance).toBe(2);

    const rewarded2 = await rewardCharmsForProposal(user.id);
    const wallet2 = (await getUserOrSpaceWallet({ userId: user.id })) as CharmWallet;

    expect(rewarded2).toBe(false);
    expect(wallet2.balance).toBe(2);
  });
});
