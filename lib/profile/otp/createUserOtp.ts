import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { createOtp } from './createOtp';
import { createRecoveryCode } from './createRecoveryCode';

export type OtpResponse = {
  code: string;
  uri: string;
  recoveryCode: string;
};

/**
 * Create a user OTP only if user doesn't have one already or it's not activated
 * @param userId string
 * @returns Contains the otp code, uri and recovery code
 */
export async function createUserOtp(userId: string): Promise<OtpResponse> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      userOTP: true
    }
  });

  if (!user) {
    throw new DataNotFoundError('User not found');
  }

  if (user.userOTP && user.userOTP.activatedAt) {
    throw new InvalidInputError('User has an OTP created');
  }

  const createdOtp = createOtp(user);

  const generatedRecoveryCode = createRecoveryCode();

  const recoveryCode = await prisma.recoveryCode.upsert({
    where: {
      id: user.userOTP?.recoveryCodeId
    },
    create: {
      code: generatedRecoveryCode.hashedOtp
    },
    update: {
      code: generatedRecoveryCode.hashedOtp
    }
  });

  await prisma.userOTP.upsert({
    where: {
      id: user.userOTP?.id
    },
    create: {
      userId: user.id,
      secret: createdOtp.code,
      recoveryCodeId: recoveryCode.id
    },
    update: {
      secret: createdOtp.code
    }
  });

  return {
    ...createdOtp,
    recoveryCode: generatedRecoveryCode.otp
  };
}
