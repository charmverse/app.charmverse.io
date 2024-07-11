import { prisma } from '@charmverse/core/prisma-client';

import { getUserProfile } from 'lib/users/getUser';
import { InvalidInputError } from 'lib/utils/errors';
import type { LoggedInUser } from '@root/models';

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
