import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { createOtp } from './createOtp';
import { createRecoveryCode } from './createRecoveryCode';

export type CreateOtpResponse = {
  code: string;
  uri: string;
  recoveryCode: string;
};

/**
 * Create a user OTP only if user doesn't have one already or it's not activated
 * @param userId string
 * @returns The otp code, uri and recovery code
 */
export async function createUserOtp(userId: string): Promise<CreateOtpResponse> {
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

  const createdRecoveryCode = createRecoveryCode();

  const recoveryCode = await prisma.recoveryCode.upsert({
    where: {
      id: user.userOTP?.recoveryCodeId || uuid()
    },
    create: {
      code: createdRecoveryCode.hashedOtp
    },
    update: {
      code: createdRecoveryCode.hashedOtp
    }
  });

  await prisma.userOTP.upsert({
    where: {
      id: user.userOTP?.id || uuid()
    },
    create: {
      userId: user.id,
      secret: createdOtp.encryptedCode,
      recoveryCodeId: recoveryCode.id
    },
    update: {
      recoveryCodeId: recoveryCode.id
    }
  });

  return {
    code: createdOtp.code,
    uri: createdOtp.uri,
    recoveryCode: createdRecoveryCode.otp
  };
}
