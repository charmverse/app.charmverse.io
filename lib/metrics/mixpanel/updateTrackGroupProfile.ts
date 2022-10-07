
import type { Space } from '@prisma/client';

import log from 'lib/log';
import { mixpanel } from 'lib/metrics/mixpanel/mixpanel';

export async function updateTrackGroupProfile (space: Space) {
  try {
    mixpanel?.groups.set('Space Id', space.id, getTrackGroupProfile(space));
  }
  catch (e) {
    log.warn(`Failed to update mixpanel profile for group id ${space.id}`);
  }
}

export function getTrackGroupProfile (space: Space) {
  return {
    $created: space.createdAt,
    $name: space.name,
    'Space Created By': space.createdBy,
    'Space Updated At': space.updatedAt
  };
}
