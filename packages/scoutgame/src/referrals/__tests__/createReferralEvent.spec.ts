import { prisma } from '@charmverse/core/prisma-client';

import { mockScout } from '../../testing/database';
import { createReferralEvent } from '../createReferralEvent';

describe('createReferralEvent', () => {
  it('should create a referral event with a valid referral code', async () => {
    const scout = await mockScout();
    const scout2 = await mockScout();

    await createReferralEvent(scout.referralCode || '', scout2.id);

    const event = await prisma.referralCodeEvent.findUnique({
      where: {
        referrerId_refereeId: {
          referrerId: scout.id,
          refereeId: scout2.id
        }
      }
    });

    expect(!!event?.id).toBeTruthy();
  });

  it('should throw error when referral code is invalid', async () => {
    const scout = await mockScout();

    const referralCode = 'INVALIDCODE';

    await expect(createReferralEvent(referralCode, scout.id)).rejects.toThrow('No Scout found');
  });
});
