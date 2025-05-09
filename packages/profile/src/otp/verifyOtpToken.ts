import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import * as OTPAuth from 'otpauth';

import { decryptRecoveryCode } from './recoveryCodeEncryption';

export async function verifyOtpToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      otp: {
        select: {
          secret: true
        }
      }
    }
  });

  if (!user?.otp) {
    throw new InvalidInputError('User OTP does not exist');
  }

  const decryptedSecret = decryptRecoveryCode(user.otp.secret);

  const delta = validateToken(decryptedSecret, token, user.username);

  if (delta === null) {
    throw new InvalidInputError('Invalid token');
  }

  return delta;
}

function validateToken(secret: string, token: string, username: string) {
  const totp = new OTPAuth.TOTP({
    issuer: 'Charmverse',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret
  });

  // token must be a string in order to work
  const delta = totp.validate({ token, window: 1 });

  return delta;
}
