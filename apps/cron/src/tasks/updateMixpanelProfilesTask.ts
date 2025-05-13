import { prisma } from '@charmverse/core/prisma-client';
import {
  batchUpdateSpaceProfiles,
  type SpaceWithMixpanelProfile
} from '@packages/metrics/mixpanel/batchUpdateSpaceProfiles';
import { getTrackGroupProfile } from '@packages/metrics/mixpanel/updateTrackGroupProfile';
import { getSpaceBlockCount } from '@packages/spaces/getSpaceBlockCount';

const perBatch = 1000;
export async function updateMixpanelProfiles({ offset = 0 }: { offset?: number } = {}): Promise<void> {
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
    spaceProfiles.push({ spaceId: space.id, profile });
  }

  await batchUpdateSpaceProfiles(spaceProfiles);

  if (spaces.length > 0) {
    return updateMixpanelProfiles({ offset: offset + perBatch });
  }
}

export async function updateMixpanelProfilesTask(): Promise<void> {
  // Wrapped function since Cron will call the method with the date
  await updateMixpanelProfiles();
}
