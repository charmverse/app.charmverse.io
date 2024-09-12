import { baseUrl, isProdEnv } from '@root/config/constants';
import { NEYNAR_SIGNER_ID } from '@root/lib/farcaster/constants';
import { writeToFarcaster } from '@root/lib/farcaster/messaging/writeToFarcaster';

import type { ConnectWaitlistTier } from './constants';
import type { TierChangeResult } from './refreshPercentilesForEveryone';

const tierLabels: Record<ConnectWaitlistTier, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  mythic: 'Mythic',
  legendary: 'Legendary'
};

export async function notifyNewScore({
  fid,
  newTier,
  percentile,
  tierChange,
  username
}: Omit<TierChangeResult, 'score'>) {
  if (tierChange !== 'up' && tierChange !== 'down') {
    return;
  }

  const message = `@${username} you moved ${tierChange} to the ${tierLabels[newTier]} tier!`;

  const embedUrl = `${baseUrl}/api/frame/${fid}/level-changed?tierChange=${tierChange}&percentile=${percentile}`;

  return writeToFarcaster({
    neynarSignerId: NEYNAR_SIGNER_ID,
    text: message,
    channelId: isProdEnv ? 'scout-game' : 'cvdev',
    embedUrl
  });
}
