import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { addCharms } from '@root/lib/charms/addCharms';
import { CharmActionTrigger, charmActionRewards } from '@root/lib/charms/constants';

const log = getLogger('referral');

export async function processSignupReferral({ code, userId }: { code?: string; userId: string }) {
  if (!code) {
    return false;
  }

  const referralCode = await prisma.referralCode.findUnique({ where: { code } });
  if (!referralCode) {
    log.warn(`Invalid referral code used`, { code });
    return false;
  }

  await prisma.referralCodeUseEvent.create({
    data: {
      refereeId: userId,
      referrerId: referralCode.userId
    }
  });

  await addCharms({
    recipient: { userId: referralCode.userId },
    amount: charmActionRewards[CharmActionTrigger.referral],
    actionTrigger: CharmActionTrigger.referral
  });

  await addCharms({
    recipient: { userId },
    amount: charmActionRewards[CharmActionTrigger.referralReferee],
    actionTrigger: CharmActionTrigger.referralReferee
  });

  // TODO: add mixpanel tracking

  log.info(`Referral code used`, { code, userId, referrerId: referralCode.userId });

  return true;
}
