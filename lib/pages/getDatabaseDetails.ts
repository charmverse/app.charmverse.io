import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { isUUID } from '@packages/utils/strings';
import { DatabasePageNotFoundError } from '@root/lib/public-api';

import { generatePageQuery } from './server/generatePageQuery';

export async function getDatabaseDetails({
  idOrPath,
  spaceId
}: {
  idOrPath: string;
  spaceId?: string;
}): Promise<Block> {
  let dbId: string | null | undefined = isUUID(idOrPath) ? idOrPath : null;

  const searchQuery = generatePageQuery({
    pageIdOrPath: idOrPath,
    spaceIdOrDomain: spaceId
  });

  if (!dbId) {
    // Get the database ID from the page
    const page = await prisma.page.findFirst({
      where: searchQuery,
      select: {
        boardId: true
      }
    });

    dbId = page?.boardId;
  }

  if (!dbId) {
    throw new DatabasePageNotFoundError(idOrPath);
  }
  const block = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: dbId,
      spaceId
    }
  });

  if (!block) {
    throw new DatabasePageNotFoundError(idOrPath);
  }

  return block;
}
