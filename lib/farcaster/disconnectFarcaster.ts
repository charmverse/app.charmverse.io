import { prisma } from '@charmverse/core/prisma-client';
import { getUserProfile } from '@root/lib/profile/getUser';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { InvalidInputError } from '@root/lib/utils/errors';

export async function disconnectFarcaster({ userId }: { userId: string }): Promise<LoggedInUser> {
  const farcasterUser = await prisma.farcasterUser.findUnique({
    where: {
      userId
    }
  });

  if (!farcasterUser) {
    throw new InvalidInputError('Farcaster account was not found');
  }

  await prisma.farcasterUser.delete({
    where: {
      fid: farcasterUser.fid
    }
  });

  return getUserProfile('id', userId);
}
