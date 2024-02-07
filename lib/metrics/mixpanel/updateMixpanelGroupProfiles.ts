import { POST } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma-client';

import type { MixPanelSpaceProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';

const mixpanelApiKey = process.env.MIXPANEL_API_KEY;

// Mixpanel sdk does not support batch group updates so we need to build request manually
// https://developer.mixpanel.com/reference/group-batch-update

const BATCH_UPDATE_URL = 'https://api.mixpanel.com/groups#group-batch-update';
const DEFAULT_HEADERS = {
  Accept: 'text/plain',
  'Content-Type': 'application/json'
};

export type SpaceWithMixpanelProfile = {
  space: Space;
  profile: MixPanelSpaceProfile;
};

export async function updateMixpanelGroupProfiles(profiles: SpaceWithMixpanelProfile[]) {
  if (!mixpanelApiKey) {
    throw new Error('MIXPANEL_API_KEY is not set');
  }

  const data = profiles.map(({ space, profile }) => {
    return {
      $token: mixpanelApiKey,
      $group_key: 'Space Id',
      $group_id: space.id,
      $set: profile
    };
  });

  try {
    await POST(BATCH_UPDATE_URL, data, { headers: DEFAULT_HEADERS });
  } catch (e) {
    log.warn('Failed to  batch update mixpanel group profiles', { error: e });
  }
}
