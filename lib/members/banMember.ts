import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { removeMember } from './removeMember';

export async function banMember({ spaceId, userId }: { userId: string; spaceId: string }) {
  await removeMember({
    spaceId,
    userId
  });

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      discordUser: true,
      verifiedEmails: true,
      wallets: true,
      googleAccounts: true
    }
  });

  if (!user) {
    throw new DataNotFoundError('User not found');
  }

  await prisma.blacklistedSpaceUser.create({
    data: {
      discordId: user.discordUser?.discordId,
      spaceId,
      userId,
      emails: [...user.verifiedEmails.map(({ email }) => email), ...user.googleAccounts.map(({ email }) => email)],
      walletAddresses: user.wallets.map(({ address }) => address.toLowerCase())
    }
  });
}
