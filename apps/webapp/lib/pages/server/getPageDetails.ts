import { prisma } from '@charmverse/core/prisma-client';

import type { PageDetails } from '../interfaces';

import { PageNotFoundError } from './errors';
import { generatePageQuery } from './generatePageQuery';

export async function getPageDetails(pageIdOrPath: string, spaceId?: string): Promise<PageDetails> {
  const searchQuery = generatePageQuery({
    pageIdOrPath,
    spaceIdOrDomain: spaceId
  });

  const page = await prisma.page.findFirst({
    where: searchQuery,
    select: {
      id: true,
      content: true,
      contentText: true,
      spaceId: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageIdOrPath);
  }
  return page;
}
