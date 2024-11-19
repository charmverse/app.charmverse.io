import { log } from '@charmverse/core/log';
import { getENSDetails, getENSName } from '@packages/blockchain/getENSName';
import { getFarcasterUsersByAddresses } from '@packages/farcaster/getFarcasterUsersByAddresses';
import { findOrCreateUser } from '@packages/scoutgame/users/findOrCreateUser';
import type { FindOrCreateUserResult } from '@packages/scoutgame/users/findOrCreateUser';
import { generateRandomName } from '@packages/scoutgame/users/generateRandomName';
import { generateUserPath } from '@packages/scoutgame/users/generateUserPath';
import { getAddress } from 'viem';

export async function findOrCreateWalletUser({
  wallet,
  newUserId
}: {
  wallet: string;
  newUserId?: string;
}): Promise<FindOrCreateUserResult> {
  const ens = await getENSName(wallet).catch((error) => {
    log.warn('Could not retrieve ENS while creating a user', { error, wallet });
    return null;
  });
  const ensDetails = await getENSDetails(ens).catch((error) => {
    log.warn('Could not retrieve ENS details while creating a user', { error, wallet });
  });
  const displayName = ens || generateRandomName();
  const path = await generateUserPath(displayName);
  let farcasterName: string | undefined;
  let farcasterId: number | undefined;
  try {
    const address = getAddress(wallet).toLowerCase();
    const response = await getFarcasterUsersByAddresses({ addresses: [address] });
    const farcasterUser = response[address]?.[0];
    farcasterName = farcasterUser?.username;
    farcasterId = farcasterUser?.fid;
  } catch (error) {
    log.warn('Could not retrieve Farcaster user', { error, wallet });
  }

  return findOrCreateUser({
    newUserId,
    walletENS: ens || undefined,
    avatar: ensDetails?.avatar || undefined,
    walletAddresses: [wallet],
    displayName,
    path,
    farcasterName,
    farcasterId
  });
}
