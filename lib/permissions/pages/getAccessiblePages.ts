import { InvalidInputError } from '@charmverse/core/errors';
import type { PageMeta, PagesRequest } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';

// Postgres uses the following characters as special characters for text search. If provided as part of the search input, they throw an error
// Although \s is a special character, it is excluded here since manually handled
// eslint-disable-next-line no-useless-escape
const tsQuerySpecialCharsRegex = /[&|!\(\):*']|(<->)|<N>/g;

export async function getAccessiblePages(input: PagesRequest): Promise<PageMeta[]> {
  if (!input.spaceId) {
    throw new InvalidInputError(`Space id is required`);
  }

  // ref: https://www.postgresql.org/docs/12/functions-textsearch.html
  // ref: https://www.postgresql.org/docs/10/textsearch-controls.html
  // prisma refs: https://github.com/prisma/prisma/issues/8950
  let formattedSearch = input.search ? input.search.replace(tsQuerySpecialCharsRegex, '') : undefined;

  if (formattedSearch) {
    formattedSearch = formattedSearch
      .split(/\s/)
      .filter((s) => s)
      .join(' & ');
  }

  const pages = await prisma.page.findMany({
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
      deletedBy: true
    }
  });

  return pages;
}
