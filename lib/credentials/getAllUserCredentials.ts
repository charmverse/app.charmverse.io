import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getAllOnChainAttestations, type EASAttestationFromApi } from './external/getExternalCredentials';
import { getCharmverseCredentialsByWallets } from './queriesAndMutations';

export async function getAllUserCredentials({ userId }: { userId: string }): Promise<EASAttestationFromApi[]> {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError('userId is invalid');
  }
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
    getCharmverseCredentialsByWallets({ wallets }),
    getAllOnChainAttestations({ wallets })
  ]).then((data) => data.flat());

  return allCredentials;
}
