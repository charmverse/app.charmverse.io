import { prisma } from '@charmverse/core';

import { isUUID } from 'lib/utilities/strings';

export async function getDatabaseDetails({ idOrPath, spaceId }: { idOrPath: string; spaceId?: string }) {
  let dbId: string | null | undefined = isUUID(idOrPath) ? idOrPath : null;

  // We need a spaceId if looking up by path
  if (!dbId && !spaceId) {
    return null;
  }

  if (!dbId) {
    // Get the database ID from the page
    const page = await prisma.page.findFirst({
      where: {
        path: idOrPath,
        spaceId
      },
      select: {
        boardId: true
      }
    });

    dbId = page?.boardId;
  }

  if (!dbId) {
    return null;
  }
  return prisma.block.findFirst({
    where: {
      type: 'board',
      id: dbId,
      spaceId
    }
  });
}
