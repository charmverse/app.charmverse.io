import { prisma } from '@charmverse/core/prisma-client';

import { groupBatchUpdate } from './groupBatchUpdate';
import { GroupKeys } from './mixpanel';
import { getTrackPageProfile } from './updateTrackPageProfile';

export async function batchUpdatePageProfiles(pageIds: string[]) {
  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      }
    },
    include: {
      permissions: {
        select: { public: true }
      }
    }
  });
  return groupBatchUpdate(
    GroupKeys.PageId,
    pages.map((page) => ({ id: page.id, ...getTrackPageProfile(page) }))
  );
}
