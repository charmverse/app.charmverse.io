import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';

import { mixpanel } from './mixpanel';

export type MixPanelSpaceProfile = {
  $created: string | Date;
  $name: string;
  'Space Created By': string;
  'Space Updated At': string | Date;
  'Space Block Quota': number;
  'Space Block Count'?: number;
  'Space Origin'?: string;
};

export async function updateTrackGroupProfile(space: Space, spaceOrigin?: string) {
  try {
    mixpanel?.groups.set('Space Id', space.id, getTrackGroupProfile({ space, spaceOrigin }));
  } catch (e) {
    log.warn(`Failed to update mixpanel profile for group id ${space.id}`);
  }
}

export function getTrackGroupProfile({
  space,
  spaceOrigin,
  blockCount
}: {
  space: Space;
  spaceOrigin?: string;
  blockCount?: number;
}) {
  const spaceProfile: MixPanelSpaceProfile = {
    $created: space.createdAt,
    $name: space.name,
    'Space Created By': space.createdBy,
    'Space Updated At': space.updatedAt,
    'Space Block Quota': space.blockQuota
  };

  if (blockCount) {
    spaceProfile['Space Block Count'] = blockCount;
  }

  if (spaceOrigin) {
    spaceProfile['Space Origin'] = spaceOrigin;
  }

  return spaceProfile;
}
