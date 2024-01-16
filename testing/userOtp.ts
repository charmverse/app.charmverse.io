import type { User, UserOTP } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import * as OTPAuth from 'otpauth';

import { createOtp } from 'lib/profile/otp/createOtp';
import { createRecoveryCode } from 'lib/profile/otp/createRecoveryCode';
import { decryptRecoveryCode } from 'lib/profile/otp/recoveryCodeEncryption';

export async function getTestUserOtp(userId: string, withRecoveryCode?: boolean) {
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

export async function updateTestUserOtp(userId: string, data: Partial<UserOTP>) {
  const userOtp = await prisma.userOTP.update({
    where: {
      userId
    },
    data
  });

  return userOtp;
}

export async function createTestUserOtp(userId: string) {
  const otp = createOtp({ username: 'Test user' } as User);
  const recoveryCode = createRecoveryCode();

  const recoveryCodePrisma = await prisma.recoveryCode.create({
    data: {
      code: recoveryCode.hashedOtp
    }
  });

  const userOtp = await prisma.userOTP.create({
    data: {
      secret: otp.encryptedCode,
      recoveryCodeId: recoveryCodePrisma.id,
      userId
    },
    include: {
      recoveryCode: true
    }
  });

  return userOtp;
}

export function generateTestOtpToken(user: User & { userOTP: UserOTP }) {
  const userSecret = decryptRecoveryCode(user.userOTP.secret);

  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label: user.username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: userSecret
  });

  return totp.generate();
}
