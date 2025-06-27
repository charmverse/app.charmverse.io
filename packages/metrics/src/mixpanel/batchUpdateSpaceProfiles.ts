import { log } from '@packages/core/log';

import { groupBatchUpdate } from './groupBatchUpdate';
import { GroupKeys } from './mixpanel';
import type { MixPanelSpaceProfile } from './updateTrackGroupProfile';

export type SpaceWithMixpanelProfile = {
  spaceId: string;
  profile: MixPanelSpaceProfile;
};

export async function batchUpdateSpaceProfiles(profiles: SpaceWithMixpanelProfile[]) {
  try {
    await groupBatchUpdate(
      GroupKeys.SpaceId,
      profiles.map(({ spaceId, profile }) => ({ id: spaceId, ...profile }))
    );
  } catch (e) {
    log.warn('Failed to  batch update mixpanel group profiles', { error: e });
  }
}
