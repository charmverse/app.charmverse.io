import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/pages/errors';

import type { PageDetails } from '../interfaces';

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
