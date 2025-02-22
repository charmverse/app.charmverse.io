import { prisma } from '@charmverse/core/prisma-client';
import { deleteUserS3Assets } from '@packages/aws/deleteUserS3Assets';

export async function blacklistUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
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

  await deleteUserS3Assets({ userId });

  await prisma.blacklistedUser.create({
    data: {
      discordId: user.discordUser?.discordId,
      userId,
      emails: [...user.verifiedEmails.map(({ email }) => email), ...user.googleAccounts.map(({ email }) => email)],
      walletAddresses: user.wallets.map(({ address }) => address.toLowerCase())
    }
  });
}
