import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import bcrypt from 'bcrypt';

export async function verifyRecoveryCode(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      otp: {
        include: {
          recoveryCode: true
        }
      }
    }
  });

  if (!user?.otp?.recoveryCode) {
    throw new InvalidInputError('User recovery code does not exist.');
  }

  const isValid = await bcrypt.compare(code, user.otp.recoveryCode.code);

  if (!isValid) {
    throw new InvalidInputError('Invalid backup code.');
  }

  return isValid;
}
