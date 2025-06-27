import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/core/errors';
import { log } from '@packages/core/log';

export type CreateOtpResponse = {
  code: string;
  uri: string;
  recoveryCode: string;
};

/**
 * Delete user OTP
 * @param userId string
 * @returns void
 */
export async function deleteUserOtp(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      otp: true
    }
  });

  if (!user) {
    throw new DataNotFoundError('User not found');
  }

  if (!user.otp) {
    throw new DataNotFoundError('User does not have otp configured');
  }

  const otp = await prisma.otp.delete({
    where: {
      userId
    }
  });

  await prisma.recoveryCode.delete({
    where: {
      id: otp.recoveryCodeId
    }
  });

  log.info(`User ${userId} deleted his otp`);
}
