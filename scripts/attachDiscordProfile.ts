/* eslint-disable no-console */
import { User } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';

function queryDiscord ({
  discordId,
  discordUsername,
  discordDiscriminator
}: {
  discordId?: string;
  discordUsername?: string;
  discordDiscriminator: string;
}) {
  return prisma.discordUser.findMany({
    where: {
      account: {
        path: ['discriminator'],
        equals: discordDiscriminator
      }
    }
  });
}

async function attachDiscordToProfile ({
  discordId,
  walletAddress
}: {
  discordId: string,
  walletAddress: string
}): Promise<User> {

  const targetUser = await prisma.user.findFirst({
    where: {
      wallets: {
        some: {
          address: walletAddress
        }
      }
    }
  });

  if (!targetUser) {
    throw new DataNotFoundError();
  }

  await prisma.discordUser.update({
    where: {
      discordId
    },
    data: {
      user: {
        connect: {
          id: targetUser.id
        }
      }
    }
  });

  return targetUser as User;

}

/**
 * 2 step process
 *
 * Step 1: Search for the user by entering their discriminator
 *
 * Step 2: Pass their discord ID to the second function
 */

// queryDiscord({ discordDiscriminator: '2138' })
//   .then(results => {
//     console.log('Results', results);
//   });

// attachDiscordToProfile({
//   discordId: '---',
//   walletAddress: '---'
// })
//   .then(results => {
//     console.log('Complete');
//   });
