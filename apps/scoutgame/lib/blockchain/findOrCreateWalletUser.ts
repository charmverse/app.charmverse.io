import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import { getENSDetails, getENSName } from '@root/lib/blockchain/getENSName';
import { shortenHex } from '@root/lib/utils/blockchain';

import { findOrCreateUser } from 'lib/users/findOrCreateUser';

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
  return findOrCreateUser({
    newUserId,
    walletENS: ens || undefined,
    avatar: ensDetails?.avatar || undefined,
    walletAddress: wallet,
    displayName: ens || shortenHex(wallet),
    username: shortenHex(wallet)
  });
}
