import type { UserOTP } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function getUserOtp(userId: string, withRecoveryCode?: boolean) {
  const userOtp = await prisma.userOTP.findUnique({
    where: {
      userId
    },
    include: {
      recoveryCode: withRecoveryCode
    }
  });

  return userOtp;
}

export async function updateUserOtp(userId: string, data: Partial<UserOTP>) {
  const userOtp = await prisma.userOTP.update({
    where: {
      userId
    },
    data
  });

  return userOtp;
}
