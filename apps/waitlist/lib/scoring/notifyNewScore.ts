import { NEYNAR_SIGNER_ID } from '@packages/farcaster/constants';
import { writeToFarcaster } from '@packages/farcaster/messaging/writeToFarcaster';
import type { ConnectWaitlistTier } from '@packages/scoutgame/waitlist/scoring/constants';
import { baseUrl, isDevEnv, isProdEnv, isStagingEnv, isTestEnv } from '@packages/utils/env';

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
  const message = `@${username} you moved ${tierChange} to the ${tierLabels[newTier]} tier!`;

  const embedUrl = `${baseUrl}/api/frame/${fid}/level-changed?tierChange=${tierChange}&percentile=${percentile}`;

  return writeToFarcaster({
    neynarSignerId: NEYNAR_SIGNER_ID,
    text: message,
    channelId: isProdEnv && !isDevEnv && !isTestEnv && !isStagingEnv ? 'scout-game' : 'cvdev',
    embedUrl
  });
}
