import { InvalidInputError } from '@charmverse/core/errors';
import type { PageMeta, PagesRequest } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export async function getAccessiblePages(input: PagesRequest): Promise<PageMeta[]> {
  if (!input.spaceId) {
    throw new InvalidInputError(`Space id is required`);
  }

  let pageLimit = input.limit ? parseInt(input.limit.toString(), 10) : undefined;
  if (!pageLimit || Number.isNaN(pageLimit) || pageLimit < 1) {
    pageLimit = undefined;
  }

  // ref: https://www.postgresql.org/docs/12/functions-textsearch.html
  // ref: https://www.postgresql.org/docs/10/textsearch-controls.html
  // prisma refs: https://github.com/prisma/prisma/issues/8950
  const formattedSearch = input.search
    ? stringUtils.escapeTsQueryCharactersAndFormatPrismaSearch(input.search)
    : undefined;

  const pages = await prisma.page.findMany({
    take: pageLimit,
    where: {
      spaceId: input.spaceId,
      deletedAt: input.archived ? { not: null } : null,
      OR: formattedSearch
        ? [
            {
              contentText: { search: formattedSearch },
              title: { search: formattedSearch }
            }
          ]
        : undefined
    },
    select: {
      id: true,
      deletedAt: true,
      createdAt: true,
      createdBy: true,
      updatedAt: true,
      updatedBy: true,
      title: true,
      headerImage: true,
      icon: true,
      path: true,
      additionalPaths: true,
      parentId: true,
      spaceId: true,
      type: true,
      boardId: true,
      index: true,
      cardId: true,
      proposalId: true,
      bountyId: true,
      hasContent: true,
      galleryImage: true,
      deletedBy: true,
      syncWithPageId: true
    }
  });

  return pages;
}
