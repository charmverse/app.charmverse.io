import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

export async function getReferralCode(userId: string) {
  const referralCode = await prisma.referralCode.upsert({
    where: { userId },
    update: {},
    create: {
      user: {
        connect: { id: userId }
      },
      code: v4().substring(0, 6)
    }
  });

  return referralCode.code;
}
