import { prisma } from '@charmverse/core/prisma-client';

import { rewardPoints } from '../../constants';
import { mockBuilderEvent, mockScout } from '../../testing/database';
import { updateReferralUsers } from '../updateReferralUsers';

describe('updateReferralUsers', () => {
  it('should create a referral event with a valid referral code', async () => {
    const referral = await mockScout();
    const referee = await mockScout();
    await updateReferralUsers(referral.referralCode || '', referee.id);

    const event = await prisma.referralCodeEvent.findFirstOrThrow({
      where: {
        builderEvent: {
          builderId: referral.id
        },
        refereeId: referee.id
      }
    });

    expect(!!event?.id).toBeTruthy();
  });

  it('should throw error when referral code is invalid', async () => {
    const scout = await mockScout();

    const referralCode = 'INVALIDCODE';

    await expect(updateReferralUsers(referralCode, scout.id)).rejects.toThrow('No Scout found');
  });

  it('should update the current balance of the referrer and referee', async () => {
    const referrer = await mockScout({ currentBalance: 50 });
    const referee = await mockScout({ currentBalance: 0 });

    const [updatedReferralUser, updatedRefereeUser] = await updateReferralUsers(
      referrer.referralCode || '',
      referee.id
    );

    expect(updatedReferralUser.id).toBe(referrer.id);
    expect(updatedReferralUser.currentBalance).toBe(50 + rewardPoints);
    expect(updatedRefereeUser.id).toBe(referee.id);
    expect(updatedRefereeUser.currentBalance).toBe(rewardPoints);
  });
});
