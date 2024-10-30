import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import { getENSDetails, getENSName } from '@root/lib/blockchain/getENSName';

import { findOrCreateUser } from 'lib/users/findOrCreateUser';
import { generateUserPath } from 'lib/users/generateUserPath';
import { generateRandomName } from 'lib/utils/generateRandomName';

export async function findOrCreateWalletUser({
  wallet,
  newUserId
}: {
  wallet: string;
  newUserId?: string;
}): Promise<Scout> {
  const ens = await getENSName(wallet).catch((error) => {
    log.warn('Could not retrieve ENS while creating a user', { error });
    return null;
  });
  const ensDetails = await getENSDetails(ens).catch((error) => {
    log.warn('Could not retrieve ENS details while creating a user', { error });
  });
  const displayName = ens || generateRandomName();
  const path = await generateUserPath(displayName);
  return findOrCreateUser({
    newUserId,
    walletENS: ens || undefined,
    avatar: ensDetails?.avatar || undefined,
    walletAddresses: [wallet],
    displayName,
    path
  });
}
