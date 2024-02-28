import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utils/types';

import { playbackRestrictionId } from './config';
import { mux } from './muxClient';

const charmVerseDomains = ['*.charmverse.io', '*.charmverse.co'];

// update referrers to include all custom subdomains
export async function updateAllowedPlaybackDomains() {
  if (mux && playbackRestrictionId) {
    const spaces = await prisma.space.findMany({
      where: {
        customDomain: {
          not: null
        }
      }
    });
    const customDomains = spaces.map((space) => space.customDomain).filter(isTruthy);
    mux.video.playbackRestrictions.updateReferrer(playbackRestrictionId, {
      allowed_domains: charmVerseDomains.concat(customDomains)
    });
    log.info('Updated referrers for mux playback restriction', { customDomains });
  }
}
