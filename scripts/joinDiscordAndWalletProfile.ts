/* eslint-disable no-console */
import { User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import { countConnectableIdentities } from '@packages/users/countConnectableIdentities';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import { isAddress } from 'viem';

/**
 * See this page for more information on how to use this script
 * https://app.charmverse.io/charmverse/page-8133628154153136
 */

function queryDiscord({
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

async function attachDiscordToProfileWithWallet({
  discordId,
  walletAddress
}: {
  discordId: string;
  walletAddress: string;
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
 * User wants to attach discord profile to a wallet account
 * @commit Set to true when ready to make the transfer
 */
async function attachWalletToProfileWithDiscord({
  discordId,
  walletAddress,
  commit = false
}: {
  discordId: string;
  walletAddress: string;
  commit?: boolean;
}): Promise<User> {
  if (!discordId) {
    throw new InvalidInputError('Discord ID is required');
  }

  const discordProfiles = await queryDiscord({
    discordDiscriminator: discordId
  });

  if (discordProfiles.length !== 1) {
    throw new InvalidInputError('Found multiple profiles. Enter the specific discordId');
  }

  const targetDiscordProfile = discordProfiles[0];

  if (!walletAddress) {
    throw new InvalidInputError('Wallet address is required');
  }

  const walletToReattach = await prisma.userWallet.findFirstOrThrow({
    where: isAddress(walletAddress)
      ? {
          address: walletAddress.toLowerCase()
        }
      : {
          ensname: walletAddress
        }
  });

  console.log('Will attach wallet', walletToReattach, '\n\n----\n\n TO \n\n----\n\n', targetDiscordProfile);

  if (commit) {
    await prisma.userWallet.update({
      where: {
        id: walletToReattach.id
      },
      data: {
        user: { connect: { id: targetDiscordProfile.userId } }
      }
    });
  }

  const updatedUser = await prisma.user.findUniqueOrThrow({
    where: {
      id: targetDiscordProfile.userId
    },
    include: sessionUserRelations
  });

  const oldUser = await prisma.user.findUniqueOrThrow({
    where: {
      id: walletToReattach.userId
    },
    include: sessionUserRelations
  });

  const identities = await countConnectableIdentities(oldUser);

  if (identities === 0) {
    await prisma.user.update({
      where: {
        id: oldUser.id
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  return updatedUser;
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

// use attachWalletToProfileWithDiscord or attachDiscordToProfileWithWallet depending on the requested direction

attachWalletToProfileWithDiscord({
  discordId: '1234',
  walletAddress: '0x7904667C340601AaB73939372C016dC5102732A2',
  commit: false
}).then((data) => console.log('Data', data));
