import { log } from '@charmverse/core/log';
import { getENSDetails, getENSName } from '@packages/blockchain/getENSName';
import { getFarcasterUsersByAddresses } from '@packages/farcaster/getFarcasterUsersByAddresses';
import { updateReferralUsers } from '@packages/scoutgame/referrals/updateReferralUsers';
import { findOrCreateUser } from '@packages/scoutgame/users/findOrCreateUser';
import type { FindOrCreateUserResult } from '@packages/scoutgame/users/findOrCreateUser';
import { generateRandomName } from '@packages/scoutgame/users/generateRandomName';
import { generateUserPath } from '@packages/scoutgame/users/generateUserPath';
import { getAddress } from 'viem';

export async function findOrCreateWalletUser({
  wallet,
  newUserId,
  referralCode
}: {
  wallet: string;
  newUserId?: string;
  referralCode?: string | null;
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

  const user = await findOrCreateUser({
    newUserId,
    walletENS: ens || undefined,
    avatar: ensDetails?.avatar || undefined,
    walletAddresses: [wallet],
    displayName,
    path,
    farcasterName,
    farcasterId
  });

  if (user?.isNew && referralCode) {
    const users = await updateReferralUsers(referralCode, user.id).catch((error) => {
      // There can be a case where the referrer is not found. Maybe someone will try to guess referral codes to get rewards.
      log.warn('Error creating referral event.', { error, startParam: referralCode, referrerId: user.id });
      return null;
    });

    if (users) {
      const [, referee] = users;
      return { ...referee, isNew: true };
    }
  }

  return user;
}
