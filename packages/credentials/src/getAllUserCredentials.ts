import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import type { EASAttestationWithFavorite } from './external/getOnchainCredentials';
import { getAllOnChainAttestations } from './external/getOnchainCredentials';
import { getGitcoinCredentialsByWallets } from './getGitcoinCredentialsByWallets';

// Use these wallets to return at least 1 of all the tracked credentials
const testWallets = [
  '0x3B60e31CFC48a9074CD5bEbb26C9EAa77650a43F',
  '0x797fed1016a2Ba7A5F5b288131D8A05511d5aA37',
  '0x707aC3937A9B31C225D8C240F5917Be97cab9F20',
  '0x1294cb2Ee30b5Db7d9438eD68f111D420b28015d',
  '0xe18B1dFb94BB3CEC3B47663F997D824D9cD0f4D2'
];

export type UserCredentialsRequest = {
  userId: string;
  includeTestnets?: boolean;
};

export async function getAllUserCredentials({
  userId,
  includeTestnets
}: UserCredentialsRequest): Promise<EASAttestationWithFavorite[]> {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError('userId is invalid');
  }
  // Re-enable when we go to prod
  const wallets = await prisma.userWallet
    .findMany({
      where: {
        userId
      }
    })
    .then((_wallets) => _wallets.map((w) => w.address));

  if (!wallets.length) {
    return [];
  }

  const allCredentials = await Promise.all([
    getGitcoinCredentialsByWallets({ wallets }).catch((error) => {
      log.error(`Error loading Gitcoin Ceramic credentials for user ${userId}`, { error, userId });
      return [];
    }),
    getAllOnChainAttestations({ wallets, includeTestnets })
  ]).then((data) => data.flat());

  return allCredentials.sort((a, b) => b.timeCreated - a.timeCreated);
}
