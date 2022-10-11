import type { Prisma } from '@prisma/client';
import { validate } from 'uuid';

import { prisma } from 'db';

import type { PageDetails } from '../interfaces';

export async function getPageDetails (pageIdOrPath: string, spaceId?: string): Promise<PageDetails | null> {

  const isValidUUid = validate(pageIdOrPath);

  // We need a spaceId if looking up by path
  if (!isValidUUid && !spaceId) {
    return null;
  }

  const searchQuery: Prisma.PageWhereInput = isValidUUid ? {
    id: pageIdOrPath
  } : {
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

