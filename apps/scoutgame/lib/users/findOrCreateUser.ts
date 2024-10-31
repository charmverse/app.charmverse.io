import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { BuilderEventType, Scout, ScoutWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import type { ConnectWaitlistTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { getTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { getUserS3FilePath, uploadFileToS3, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getENSName } from '@root/lib/blockchain/getENSName';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';
import { capitalize } from '@root/lib/utils/strings';
import sharp from 'sharp';
import { v4 } from 'uuid';
import type { Address } from 'viem';
import { isAddress } from 'viem/utils';

import { generateRandomAvatar } from 'lib/utils/generateRandomAvatar';

const waitlistTierPointsRecord: Record<ConnectWaitlistTier, number> = {
  legendary: 60,
  mythic: 30,
  epic: 20,
  rare: 15,
  common: 10
};

export type FindOrCreateUserResult = Pick<Scout, 'id' | 'onboardedAt'> & { scoutWallet?: ScoutWallet[] };

export async function findOrCreateUser({
  newUserId,
  farcasterId,
  walletAddresses,
  tierOverride,
  ...userProps
}: {
  walletAddresses?: string[];
  farcasterId?: number;
  walletENS?: string;
  newUserId?: string;
  avatar?: string;
  bio?: string;
  displayName: string;
  path: string;
  farcasterName?: string;
  tierOverride?: ConnectWaitlistTier;
}): Promise<FindOrCreateUserResult> {
  if (!farcasterId && !walletAddresses?.length) {
    throw new InvalidInputError('Missing required fields for user creation');
  }

  // Only valid addresses are included
  const lowercaseAddresses = walletAddresses
    ? walletAddresses.map((a) => a.toLowerCase()).filter((a): a is Address => isAddress(a))
    : undefined;

  const scout = await prisma.scout.findFirst({
    where: farcasterId ? { farcasterId } : { scoutWallet: { some: { address: { in: lowercaseAddresses } } } },
    select: {
      id: true,
      onboardedAt: true
    }
  });

  if (scout) {
    trackUserAction('sign_in', { userId: scout.id });
    return scout;
  }

  const userId = newUserId || v4();

  if (!userProps?.avatar) {
    const randomAvatarSvg = generateRandomAvatar();
    const imageBuffer = await sharp(Buffer.from(randomAvatarSvg))
      // Increase size for better quality
      .resize(256, 256)
      .png()
      .toBuffer();

    const pathInS3 = getUserS3FilePath({ userId, url: 'avatar.png' });
    try {
      const { fileUrl } = await uploadFileToS3({
        pathInS3,
        content: imageBuffer,
        contentType: 'image/png'
      });
      userProps.avatar = fileUrl;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, userId });
    }
  } else if (userProps?.avatar) {
    const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(userProps?.avatar) });
    try {
      const { url } = await uploadUrlToS3({ pathInS3, url: userProps?.avatar });
      userProps.avatar = url;
    } catch (e) {
      log.error('Failed to save avatar', { error: e, pathInS3, url: userProps?.avatar, userId });
    }
  }

  // retrieve ENS name if wallet address is provided
  if (!!lowercaseAddresses?.length && !userProps.walletENS) {
    const ens = await getENSName(lowercaseAddresses[0]).catch((error) => {
      log.warn('Could not retrieve ENS while creating a user', { error });
      return null;
    });
    userProps.walletENS = ens || undefined;
  }

  const waitlistRecord = farcasterId
    ? await prisma.connectWaitlistSlot.findUnique({
        where: {
          fid: farcasterId
        }
      })
    : undefined;

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
      scoutWallet: lowercaseAddresses?.length
        ? {
            create: lowercaseAddresses?.map((address) => ({
              address
            }))
          }
        : undefined,
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
    path: userProps.path,
    displayName: userProps.displayName,
    fid: farcasterId
  });

  return newScout;
}
