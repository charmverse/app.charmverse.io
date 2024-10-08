import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { ConnectWaitlistTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { tierDistributionMap, getTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { isDevEnv, isStagingEnv } from '@root/config/constants';
import { DateTime } from 'luxon';

export const launchDates: Record<string, ConnectWaitlistTier> = {
  '2024-10-08': 'legendary',
  '2024-10-15': 'mythic',
  '2024-10-18': 'epic',
  '2024-10-22': 'rare',
  '2024-10-24': 'common'
};

// check htat user signed up to the waitlist
export async function authorizeUserByLaunchDate({ fid, now = DateTime.now() }: { fid: number; now?: DateTime }) {
  // if (isDevEnv || isStagingEnv) {
  //   log.debug('Skip whitelist check in dev/staging');
  //   return true;
  // }

  const matches = await prisma.scout.count({
    where: {
      farcasterId: fid
    }
  });

  // users who have already been whitelisted
  if (matches > 0) {
    return true;
  }

  // check waitlist tier
  const waitlistRecord = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid
    }
  });

  const tier = getTier(waitlistRecord?.percentile);
  if (waitlistRecord && waitlistRecord.percentile) {
    for (const launchDate of Object.keys(launchDates)) {
      const launchTier = launchDates[launchDate];
      if (now.toISODate() >= launchDate && tier === launchTier) {
        log.debug(`Authorizing user ${fid} for ${tier} tier`);
        return true;
      }
    }
  }
  throw new UnauthorisedActionError('Scout Game is in private beta');
}
