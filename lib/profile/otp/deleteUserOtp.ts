import { prisma } from '@charmverse/core/prisma-client';

export async function deleteUserOtp(userId: string) {
  await prisma.userOTP.delete({
    where: {
      userId
    }
  });
}
