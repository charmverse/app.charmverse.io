import { prisma } from '@charmverse/core/prisma-client';

export async function createReferralEvent(referralCode: string, refereeId: string) {
  const referral = await prisma.scout.findUniqueOrThrow({
    where: {
      referralCode
    },
    select: {
      id: true
    }
  });

  const referrerId = referral?.id;

  return prisma.referralCodeEvent.create({
    data: {
      referrerId,
      refereeId
    }
  });
}
