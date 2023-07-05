import * as http from '@charmverse/core/http';
import { prisma } from '@charmverse/core/prisma-client';

import { getGame7Inventory, getGame7UserId } from 'lib/game7/client';
import type { Game7Inventory } from 'lib/game7/interface';

export async function getGame7Profile({ userId }: { userId: string }): Promise<null | Game7Inventory> {
  const game7Token = process.env.GAME7_TOKEN;
  if (!game7Token) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          address: true
        }
      },
      email: true,
      discordUser: {
        select: {
          account: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const discordUserAccount = user.discordUser?.account;
  const userEmail = user.email;

  const walletAddresses = user.wallets.map((wallet) => wallet.address);

  let game7UserId: string | null = null;

  for (const walletAddress of walletAddresses) {
    game7UserId = await getGame7UserId({
      walletAddress
    });
    if (game7UserId) {
      break;
    }
  }

  if (!game7UserId && discordUserAccount) {
    const discordUsername = (discordUserAccount as any).username as undefined | string;
    const discordDiscriminator = (discordUserAccount as any).discriminator as undefined | string;
    if (discordUsername) {
      game7UserId = await getGame7UserId({
        discordHandle: `${discordUsername}#${discordDiscriminator}`
      });
    }
  }

  if (!game7UserId && userEmail) {
    game7UserId = await getGame7UserId({
      email: userEmail
    });
  }

  if (!game7UserId) {
    return null;
  }

  return getGame7Inventory(game7UserId);
}
