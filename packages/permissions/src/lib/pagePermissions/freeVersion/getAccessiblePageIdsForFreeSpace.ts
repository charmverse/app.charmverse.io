import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import type { PagesRequest } from '@packages/core/pages';
import { stringUtils } from '@packages/core/utilities';

import { getAccessibleProposalIdsForFreeSpace } from 'lib/proposalPermissions/freeVersion/getAccessibleProposalIdsForFreeSpace';

export async function getAccessiblePageIdsForFreeSpace(input: PagesRequest): Promise<string[]> {
  if (!input.spaceId) {
    throw new InvalidInputError(`Space id is required`);
  }

  const accessibleProposalIds = await getAccessibleProposalIdsForFreeSpace(input).then(
    (proposalIds) => new Map(proposalIds.map((id) => [id, id]))
  );

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
      type: true
    }
  });

  return pages
    .filter((p) => {
      return p.type !== 'proposal' || (p.type === 'proposal' && !!accessibleProposalIds.get(p.id));
    })
    .map((p) => p.id);
}
