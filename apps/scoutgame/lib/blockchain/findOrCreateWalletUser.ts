import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import type { User as FarcasterUserProfile } from '@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster';
import { getFarcasterUsersByAddresses } from '@packages/farcaster/getFarcasterUsersByAddresses';
import { getENSDetails, getENSName } from '@root/lib/blockchain/getENSName';
import { getAddress } from 'viem';

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
    log.warn('Could not retrieve ENS while creating a user', { error, wallet });
    return null;
  });
  const ensDetails = await getENSDetails(ens).catch((error) => {
    log.warn('Could not retrieve ENS details while creating a user', { error, wallet });
  });
  const displayName = ens || generateRandomName();
  const path = await generateUserPath(displayName);
  let farcasterUser: null | FarcasterUserProfile = null;
  try {
    const address = getAddress(wallet).toLowerCase();
    const response = await getFarcasterUsersByAddresses({ addresses: [address] });
    farcasterUser = response[address]?.[0];
  } catch (error) {
    log.warn('Could not retrieve Farcaster user', { error, wallet });
  }

  const farcasterUsername = farcasterUser?.username;
  const farcasterName = farcasterUser?.display_name;
  const farcasterId = farcasterUser?.fid;

  return findOrCreateUser({
    newUserId,
    walletENS: ens || undefined,
    avatar: ensDetails?.avatar || undefined,
    walletAddresses: [wallet],
    displayName,
    path,
    farcasterName,
    farcasterUsername,
    farcasterId
  });
}
