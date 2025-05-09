import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { createOtp } from './createOtp';

export type GetOtpResponse = {
  code: string;
  uri: string;
};

/**
 * Verify code from Authenticator app and get user OTP
 * @param userId string
 * @returns The otp code and uri
 */
export async function getUserOtp(userId: string): Promise<GetOtpResponse> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      otp: true
    }
  });

  if (!user?.otp?.activatedAt) {
    throw new InvalidInputError('User OTP is not activated');
  }

  const createdOtp = createOtp(user);

  return {
    code: createdOtp.code,
    uri: createdOtp.uri
  };
}
