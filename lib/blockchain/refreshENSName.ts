import { prisma } from '@charmverse/core/prisma-client';

import { getUserProfile } from 'lib/users/getUser';
import { shortWalletAddress } from 'lib/utils/blockchain';
import { InvalidInputError, MissingDataError } from 'lib/utils/errors';
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

  const wallet = await prisma.userWallet.findUnique({
    where: {
      address: lowerCaseAddress
    }
  });

  if (!wallet) {
    throw new MissingDataError('No user wallet found with this address');
  }

  const walletAddress = wallet.address;

  const ensName = await getENSName(walletAddress);

  await prisma.userWallet.update({
    where: {
      address,
      NOT: {
        ensname: ensName
      }
    },
    data: {
      ensname: ensName,
      // Also update the username
      user: {
        update: {
          where: {
            OR: [{ username: shortWalletAddress(address) }, { username: wallet.ensname || '' }]
          },
          data: {
            username: ensName || undefined
          }
        }
      }
    }
  });

  return getUserProfile('id', userId);
}
