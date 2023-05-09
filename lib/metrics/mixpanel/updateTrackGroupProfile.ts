import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';

import { mixpanel } from './mixpanel';

type MixPanelSpaceProfile = {
  $created: string | Date;
  $name: string;
  'Space Created By': string;
  'Space Updated At': string | Date;
  'Space Origin'?: string;
};

export async function updateTrackGroupProfile(space: Space, spaceOrigin?: string) {
  try {
    mixpanel?.groups.set('Space Id', space.id, getTrackGroupProfile(space, spaceOrigin));
  } catch (e) {
    log.warn(`Failed to update mixpanel profile for group id ${space.id}`);
  }
}

export function getTrackGroupProfile(space: Space, spaceOrigin?: string) {
  const spaceProfile: MixPanelSpaceProfile = {
    $created: space.createdAt,
    $name: space.name,
    'Space Created By': space.createdBy,
    'Space Updated At': space.updatedAt
  };

  if (spaceOrigin) {
    spaceProfile['Space Origin'] = spaceOrigin;
  }

  return spaceProfile;
}
