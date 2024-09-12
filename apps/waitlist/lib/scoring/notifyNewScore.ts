import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl, isProdEnv } from '@root/config/constants';
import { NEYNAR_SIGNER_ID } from '@root/lib/farcaster/constants';
import { writeToFarcaster } from '@root/lib/farcaster/messaging/writeToFarcaster';

import type { ConnectWaitlistTier, TierChange } from './constants';

type WaitlistScoreNotification = {
  fid: number | string;
  tier: ConnectWaitlistTier;
  tierChange: TierChange;
};

const tierLabels: Record<ConnectWaitlistTier, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  mythic: 'Mythic',
  legendary: 'Legendary'
};

export async function notifyNewScore({ fid, tier, tierChange }: WaitlistScoreNotification) {
  if (tierChange !== 'up' && tierChange !== 'down') {
    return;
  }

  const waitlistSlot = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid: parseInt(fid.toString())
    },
    select: {
      username: true,
      percentile: true
    }
  });

  if (!waitlistSlot) {
    return;
  }

  const message = `@${waitlistSlot.username} you moved ${tierChange} to the ${tierLabels[tier]} tier!`;

  const embedUrl = `${baseUrl}/api/frame/${fid}/level-changed?tierChange=${tierChange}&percentile=${waitlistSlot.percentile}`;

  return writeToFarcaster({
    neynarSignerId: NEYNAR_SIGNER_ID,
    text: message,
    channelId: isProdEnv ? 'scout-game' : 'cvdev',
    embedUrl
  });
}
