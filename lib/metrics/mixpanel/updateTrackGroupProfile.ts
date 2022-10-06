
import type { Space } from '@prisma/client';

import log from 'lib/log';
import { mixpanel } from 'lib/metrics/mixpanel/mixpanel';

export async function updateTrackGroupProfile (space: Space) {
  const profile = {
    $created: space.createdAt,
    $name: space.name
  };

  try {
    mixpanel?.groups.set('Space Id', space.id, profile);
  }
  catch (e) {
    log.warn(`Failed to update mixpanel profile for group id ${space.id}`);
  }
}
