import type { UserEntity } from 'serverless/webhook/interfaces';

import { prisma } from 'db';

export async function getWebhookUserEntity(userId: string): Promise<UserEntity> {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    include: {
      wallets: true,
      googleAccounts: true,
      discordUser: true
    }
  });
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    googleEmail: user.googleAccounts[0]?.email,
    wallet: user.wallets[0]?.address,
    discordId: user.discordUser?.discordId
  };
}
