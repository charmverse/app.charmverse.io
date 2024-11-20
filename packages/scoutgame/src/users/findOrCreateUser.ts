import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { BuilderEventType, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import {
  getUserS3FilePath,
  uploadFileToS3,
  uploadUrlToS3,
  getFilenameWithExtension
} from '@packages/aws/uploadToS3Server';
import { getENSName } from '@packages/blockchain/getENSName';
import { capitalize, randomString } from '@packages/utils/strings';
import sharp from 'sharp';
import { v4 } from 'uuid';
import type { Address } from 'viem';
import { isAddress } from 'viem/utils';

import { currentSeason, getCurrentWeek } from '../dates';
import { getTier } from '../waitlist/scoring/constants';
import type { ConnectWaitlistTier } from '../waitlist/scoring/constants';

import { generateRandomAvatar } from './generateRandomAvatar';

const waitlistTierPointsRecord: Record<ConnectWaitlistTier, number> = {
  legendary: 60,
  mythic: 30,
  epic: 20,
  rare: 15,
  common: 10
};

export type FindOrCreateUserResult = Pick<Scout, 'id' | 'onboardedAt' | 'agreedToTermsAt'> & {
  isNew: boolean;
};

export async function findOrCreateUser({
  newUserId,
  farcasterId,
  walletAddresses,
  tierOverride,
  telegramId,
  ...userProps
}: {
  walletAddresses?: string[];
  farcasterId?: number;
  telegramId?: number;
  walletENS?: string;
  newUserId?: string;
  avatar?: string;
  bio?: string;
  displayName: string;
  path: string;
  farcasterName?: string;
  tierOverride?: ConnectWaitlistTier;
}): Promise<FindOrCreateUserResult> {
  if (!farcasterId && !telegramId && !walletAddresses?.length) {
    throw new InvalidInputError('Missing required fields for user creation');
  }

  // Only valid addresses are included
  const lowercaseAddresses = walletAddresses
    ? walletAddresses.map((a) => a.toLowerCase()).filter((a): a is Address => isAddress(a))
    : undefined;

  const scout = await prisma.scout.findFirst({
    where: farcasterId
      ? { farcasterId }
      : telegramId
        ? { telegramId }
        : { scoutWallet: { some: { address: { in: lowercaseAddresses } } } },
    select: {
      id: true,
      onboardedAt: true,
      agreedToTermsAt: true
    }
  });

  if (scout) {
    return { ...scout, isNew: false };
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
      telegramId,
      referralCode: randomString(),
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

  return { ...newScout, isNew: true };
}
