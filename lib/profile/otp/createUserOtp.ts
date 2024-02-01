import { DataNotFoundError } from '@charmverse/core/errors';
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
      otp: true
    }
  });

  if (!user) {
    throw new DataNotFoundError('User not found');
  }

  const createdOtp = createOtp(user);

  const createdRecoveryCode = await createRecoveryCode();

  if (user.otp?.recoveryCodeId) {
    await prisma.recoveryCode.update({
      where: {
        id: user.otp.recoveryCodeId
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  const recoveryCode = await prisma.recoveryCode.create({
    data: {
      code: createdRecoveryCode.hashedOtp
    }
  });

  await prisma.otp.upsert({
    where: {
      id: user.otp?.id || uuid()
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
