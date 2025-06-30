import { prisma } from '@charmverse/core/prisma-client';
import { getENSName } from '@packages/blockchain/getENSName';
import { log } from '@packages/core/log';
import { getUserProfile } from '@packages/profile/getUser';
import type { LoggedInUser } from '@packages/profile/getUser';
import { matchWalletAddress, shortWalletAddress } from '@packages/utils/blockchain';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';

export type ENSUserNameRefresh = {
  userId: string;
  address: string;
};

export async function refreshENSName({ userId, address }: ENSUserNameRefresh): Promise<LoggedInUser> {
  if (!userId || !address) {
    throw new InvalidInputError('userId and walletAddress are required');
  }

  const lowerCaseAddress = address.toLowerCase();

  const wallet = await prisma.userWallet.findUnique({
    where: {
      address: lowerCaseAddress
    },
    include: {
      user: {
        select: {
          username: true
        }
      }
    }
  });

  if (!wallet) {
    throw new MissingDataError('No user wallet found with this address');
  }
  try {
    const ensName = await getENSName(lowerCaseAddress);

    if (ensName !== wallet.ensname) {
      const shouldUpdate = matchWalletAddress(wallet.user.username, wallet);

      await prisma.userWallet.update({
        where: {
          address: lowerCaseAddress
        },
        data: {
          ensname: ensName,
          // Also update the username
          user: shouldUpdate
            ? {
                update: {
                  data: {
                    username: ensName || undefined
                  }
                }
              }
            : undefined
        }
      });
    }
  } catch (error) {
    log.warn('Could not refresh user wallet ENS', { error });
  }

  return getUserProfile('id', userId);
}
