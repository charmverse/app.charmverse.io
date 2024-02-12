import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { getSnapshotSpace } from 'lib/snapshot/getSpace';

export async function updateSnapshotDomain(spaceId: string, snapshotDomain: string | null) {
  if (snapshotDomain) {
    const snapshotSpace = await getSnapshotSpace(snapshotDomain);

    if (!snapshotSpace) {
      throw new DataNotFoundError(`No snapshot domain ${snapshotDomain} was found`);
    }
  }

  const space = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      snapshotDomain
    }
  });

  return space;
}
