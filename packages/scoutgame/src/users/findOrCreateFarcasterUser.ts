import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { generateRandomName } from '@packages/scoutgame/users/generateRandomName';
import { generateUserPath } from '@packages/scoutgame/users/generateUserPath';
import { uuidFromNumber } from '@packages/utils/uuid';

import { updateReferralUsers } from '../referrals/updateReferralUsers';
import type { ConnectWaitlistTier } from '../waitlist/scoring/constants';

import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';

export async function findOrCreateFarcasterUser({
  fid,
  tierOverride,
  referralCode
}: {
  fid: number;
  tierOverride?: ConnectWaitlistTier;
  referralCode?: string | null;
}): Promise<FindOrCreateUserResult> {
  // check if user already exists to avoid api calls to neynar
  const existing = await prisma.scout.findUnique({
    where: { farcasterId: fid },
    select: {
      id: true,
      onboardedAt: true,
      agreedToTermsAt: true
    }
  });
  if (existing) {
    return { isNew: false, ...existing };
  }
  const profile = await getFarcasterUserById(fid).catch((error) => {
    log.error('Error fetching Farcaster profile', { fid, error });
    return null;
  });
  const displayName = profile?.display_name || generateRandomName();
  const user = await findOrCreateUser({
    newUserId: uuidFromNumber(fid),
    farcasterId: fid,
    avatar: profile?.pfp_url,
    bio: profile?.profile?.bio?.text,
    walletAddresses: profile?.verifications,
    displayName,
    path: await generateUserPath(profile?.username ?? displayName),
    tierOverride,
    farcasterName: profile?.username
  });

  if (user?.isNew && referralCode) {
    const users = await updateReferralUsers(referralCode, user.id).catch((error) => {
      // There can be a case where the referrer is not found. Maybe someone will try to guess referral codes to get rewards.
      log.warn('Error creating referral event.', { error, startParam: referralCode, referrerId: user.id });
      return null;
    });

    if (users) {
      const [, referee] = users;

      trackUserAction('referral_link_used', {
        userId: user.id
      });

      return { ...referee, isNew: true };
    }
  }

  return user;
}
