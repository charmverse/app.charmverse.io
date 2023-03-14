import type { Space } from '@prisma/client';

import log from 'lib/log';

import { mixpanel } from './mixpanel';

type MixPanelSpaceProfile = {
  $created: string;
  $name: string;
  'Space Created By': string;
  'Space Updated At': string;
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
    $created: String(space.createdAt),
    $name: space.name,
    'Space Created By': space.createdBy,
    'Space Updated At': String(space.updatedAt)
  };

  if (spaceOrigin) {
    spaceProfile['Space Origin'] = spaceOrigin;
  }

  return spaceProfile;
}
