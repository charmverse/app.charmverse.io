import { prisma } from 'db';
import { getUserProfile } from 'lib/users/getUser';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

import { getENSName } from './getENSName';

export type ENSUserNameRefresh = {
  userId: string;
  address: string;
};

export async function refreshENSName({ userId, address }: ENSUserNameRefresh): Promise<LoggedInUser> {
  if (!userId || !address) {
    throw new InvalidInputError('userId and walletAddress are required');
  }

  const lowerCaseAddress = address.toLowerCase();

  const user = await getUserProfile('id', userId);

  if (!user.wallets.some((w) => w.address === lowerCaseAddress)) {
    throw new MissingDataError('No user wallet found with this address');
  }

  const ensName = await getENSName(address);

  if (ensName) {
    await prisma.userWallet.update({
      where: {
        address: lowerCaseAddress
      },
      data: {
        ensname: ensName,
        // Also update the username if it currently matches the wallet address for this ENS name
        user:
          user.username === lowerCaseAddress
            ? {
                update: {
                  username: ensName
                }
              }
            : undefined
      }
    });
  }

  return getUserProfile('id', userId);
}
