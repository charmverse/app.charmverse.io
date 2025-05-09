import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { getUserOrSpaceBalance } from '@packages/lib/charms/getUserOrSpaceBalance';

import { getReferralCode } from '../getReferralCode';
import { processSignupReferral } from '../processSignupReferral';

describe('processSignupReferral', () => {
  it('Should successfully process valid referral code and add charms to referee', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    const { user: user2 } = await generateUserAndSpace({ isAdmin: true });
    const userCode = await getReferralCode(user.id, true);

    const res = await processSignupReferral({ code: userCode || '', userId: user2.id });
    const balance = await getUserOrSpaceBalance({ userId: user.id });

    expect(balance?.balance).toBe(5);
    expect(res).toBe(true);
  });

  it('Should not process invalid invite code', async () => {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    const { user: user2 } = await generateUserAndSpace({ isAdmin: true });

    const res = await processSignupReferral({ code: 'asdf', userId: user2.id });
    const balance = await getUserOrSpaceBalance({ userId: user.id });

    expect(balance?.balance).toBe(0);
    expect(res).toBe(false);
  });
});
