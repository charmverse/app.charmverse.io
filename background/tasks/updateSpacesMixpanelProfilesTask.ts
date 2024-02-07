import { prisma } from '@charmverse/core/prisma-client';

import {
  updateMixpanelGroupProfiles,
  type SpaceWithMixpanelProfile
} from 'lib/metrics/mixpanel/updateMixpanelGroupProfiles';
import { getTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { getSpaceBlockCount } from 'lib/spaces/getSpaceBlockCount';

const perBatch = 1000;
export async function updateSpacesMixpanelProfiles({ offset = 0 }: { offset?: number } = {}): Promise<void> {
  // Load limited number of spaces at a time
  const spaces = await prisma.space.findMany({
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    }
  });

  const spaceProfiles: SpaceWithMixpanelProfile[] = [];

  for (const space of spaces) {
    let blockCount = 0;
    try {
      const blockCountInfo = await getSpaceBlockCount({ spaceId: space.id });
      blockCount = blockCountInfo.count;
    } catch (e) {
      // no block information
    }

    const profile = getTrackGroupProfile({ space, blockCount });
    spaceProfiles.push({ space, profile });
  }

  await updateMixpanelGroupProfiles(spaceProfiles);

  if (spaces.length > 0) {
    return updateSpacesMixpanelProfiles({ offset: offset + perBatch });
  }
}

export async function updateSpacesMixpanelProfilesTask(): Promise<void> {
  // Wrapped function since Cron will call the method with the date
  await updateSpacesMixpanelProfiles();
}
