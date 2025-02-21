import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';

import { playbackRestrictionId } from './config';
import { mux } from './muxClient';

const charmVerseDomains = ['*.charmverse.io', '*.charmverse.co'];

// update referrers to include all custom subdomains
export async function updateAllowedPlaybackDomains({ limit }: { limit?: number } = {}) {
  if (mux && playbackRestrictionId) {
    const spaces = await prisma.space.findMany({
      where: {
        customDomain: {
          not: null
        }
      }
    });
    const customDomains = spaces.map((space) => space.customDomain).filter(isTruthy);
    const allDomains = charmVerseDomains.concat(customDomains);
    mux.video.playbackRestrictions.updateReferrer(playbackRestrictionId, {
      allowed_domains: limit ? allDomains.slice(0, limit) : allDomains
    });
    log.info('Updated referrers for mux playback restriction', { customDomains });
  }
}
