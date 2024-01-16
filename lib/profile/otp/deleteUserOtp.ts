import { prisma } from '@charmverse/core/prisma-client';

export async function deleteUserOtp(userId: string) {
  const userOtp = await prisma.userOTP.update({
    where: {
      userId
    },
    data: {
      deletedAt: new Date(),
      recoveryCode: {
        update: {
          deletedAt: new Date()
        }
      }
    }
  });

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      userOTP: {
        disconnect: true
      }
    }
  });
}
