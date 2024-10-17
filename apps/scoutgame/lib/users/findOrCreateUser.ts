import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { BuilderEventType, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import type { ConnectWaitlistTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { getTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getENSName } from '@root/lib/blockchain/getENSName';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';
import { capitalize } from '@root/lib/utils/strings';
import { v4 } from 'uuid';

const waitlistTierPointsRecord: Record<ConnectWaitlistTier, number> = {
  legendary: 60,
  mythic: 30,
  epic: 20,
  rare: 15,
  common: 10
};

export async function findOrCreateUser({
  newUserId,
  farcasterId,
  walletAddress,
  tierOverride,
  ...userProps
}: {
  walletAddress?: string;
  farcasterId?: number;
  walletENS?: string;
  newUserId?: string;
  avatar?: string;
  bio?: string;
  displayName: string;
  username: string;
  tierOverride?: ConnectWaitlistTier;
}): Promise<Scout> {
  if (!farcasterId && !walletAddress) {
    throw new InvalidInputError('Missing required fields for user creation');
  }

  const lowercaseAddress = walletAddress?.toLowerCase();

  const scout = await prisma.scout.findFirst({
    where: farcasterId ? { farcasterId } : { walletAddress: lowercaseAddress }
  });

  if (scout) {
    trackUserAction('sign_in', { userId: scout.id });
    return scout;
  }

  const userId = newUserId || v4();

  // upload avatars in case they are hosted on IPFS
  if (userProps?.avatar) {
    const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(userProps?.avatar) });
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: userProps?.avatar });
      userProps.avatar = url;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: userProps?.avatar, userId });
    }
  }

  // retrieve ENS name if wallet address is provided

  if (walletAddress && !userProps.walletENS) {
    const ens = await getENSName(walletAddress).catch((error) => {
      log.warn('Could not retrieve ENS while creating a user', { error });
      return null;
    });
    userProps.walletENS = ens || undefined;
  }

  const waitlistRecord = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid: farcasterId
    }
  });

  let points = 0;
  let tier: ConnectWaitlistTier | undefined;

  if (tierOverride) {
    tier = tierOverride;
    points = waitlistTierPointsRecord[tier] || 0;
    log.info('Using tier override', { tier, points });
  } else if (waitlistRecord?.percentile) {
    tier = getTier(waitlistRecord.percentile);
    points = waitlistTierPointsRecord[tier] || 0;
    log.info('Creating user with waitlist percentile', { percentile: waitlistRecord.percentile, tier, points });
  }
  const newScout = await prisma.scout.create({
    data: {
      ...userProps,
      id: userId,
      walletAddress: lowercaseAddress,
      farcasterId,
      currentBalance: points,
      pointsReceived:
        points && tier
          ? {
              create: {
                value: points,
                claimedAt: new Date(),
                event: {
                  create: {
                    season: currentSeason,
                    type: 'misc_event' as BuilderEventType,
                    description: `Received points for achieving ${capitalize(tier)} status on waitlist`,
                    week: getCurrentWeek(),
                    builderId: userId
                  }
                },
                activities: {
                  create: {
                    type: 'points',
                    userId,
                    recipientType: 'scout'
                  }
                }
              }
            }
          : undefined
    }
  });

  trackUserAction('sign_up', {
    userId: newScout.id,
    username: userProps.username,
    fid: farcasterId
  });

  return newScout;
}
