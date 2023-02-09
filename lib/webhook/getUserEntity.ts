import type { UserEntity } from 'serverless/webhook/interfaces';

import { prisma } from 'db';

export async function getUserEntity(userId: string): Promise<UserEntity> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      wallets: true,
      googleAccounts: true,
      discordUser: true
    }
  });
}
