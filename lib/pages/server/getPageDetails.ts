import { prisma } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/dist/prisma';
import { validate } from 'uuid';

import type { PageDetails } from '../interfaces';

export async function getPageDetails(pageIdOrPath: string, spaceId?: string): Promise<PageDetails | null> {
  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = isValidUUid
    ? {
        id: pageIdOrPath
      }
    : {
        path: pageIdOrPath,
        spaceId
      };

  return prisma.page.findFirst({
    where: searchQuery,
    select: {
      id: true,
      content: true,
      contentText: true,
      spaceId: true
    }
  });
}
