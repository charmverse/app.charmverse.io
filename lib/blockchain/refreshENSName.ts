import { prisma } from '@charmverse/core';

import { getUserProfile } from 'lib/users/getUser';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';
import { matchWalletAddress } from 'lib/utilities/strings';
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

  const wallet = user.wallets.find((w) => matchWalletAddress(lowerCaseAddress, w));

  if (!wallet) {
    throw new MissingDataError('No user wallet found with this address');
  }

  const walletAddress = wallet.address;

  const ensName = await getENSName(walletAddress);

  if (ensName) {
    await prisma.userWallet.update({
      where: {
        address: walletAddress
      },
      data: {
        ensname: ensName,
        // Also update the username if it currently matches the wallet address for this ENS name
        user: matchWalletAddress(user.username, walletAddress)
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
