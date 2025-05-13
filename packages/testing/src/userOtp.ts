import type { User, Otp } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { createOtp } from '@packages/profile/otp/createOtp';
import { createRecoveryCode } from '@packages/profile/otp/createRecoveryCode';
import { decryptRecoveryCode } from '@packages/profile/otp/recoveryCodeEncryption';
import * as OTPAuth from 'otpauth';

export async function getTestUserOtp(userId: string, withRecoveryCode?: boolean) {
  const userOtp = await prisma.otp.findUnique({
    where: {
      userId
    },
    include: {
      recoveryCode: withRecoveryCode
    }
  });

  return userOtp;
}

export async function updateTestUserOtp(userId: string, data: Partial<Otp>) {
  const userOtp = await prisma.otp.update({
    where: {
      userId
    },
    data
  });

  return userOtp;
}

export async function createTestUserOtp(userId: string) {
  const otp = createOtp({ username: 'Test user' } as User);
  const recoveryCode = await createRecoveryCode();

  const recoveryCodePrisma = await prisma.recoveryCode.create({
    data: {
      code: recoveryCode.hashedOtp
    }
  });

  const userOtp = await prisma.otp.create({
    data: {
      secret: otp.encryptedCode,
      recoveryCodeId: recoveryCodePrisma.id,
      userId
    },
    include: {
      recoveryCode: true
    }
  });

  return { otp: userOtp, backupCode: recoveryCode.otp };
}

export function generateTestOtpToken(label: string, secret: string, decrypted?: boolean) {
  const userSecret = decrypted ? secret : decryptRecoveryCode(secret);

  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: userSecret
  });

  return totp.generate();
}
