import { InvalidInputError, stringUtils } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/dist/prisma';

type PageQuery = {
  pageIdOrPath: string;
  spaceIdOrDomain?: string;
};

/**
 * Lookup pages with different types of query
 * Solves an issue where pagePath might actually be a UUID
 */
export function generatePageQuery({ pageIdOrPath, spaceIdOrDomain }: PageQuery): Prisma.PageWhereInput {
  const pageIdOrPathIsValidUUid = stringUtils.isUUID(pageIdOrPath);
  const spaceIdOrDomainIsValidUUid = !!spaceIdOrDomain && stringUtils.isUUID(spaceIdOrDomain);

  let searchQuery: Prisma.PageWhereInput = {};

  if (!pageIdOrPath) {
    throw new InvalidInputError(`You must provide a page id or path to fetch a page.`);
  } else if (!spaceIdOrDomain && !pageIdOrPathIsValidUUid) {
    throw new InvalidInputError(`To fetch a page by path, you must also provide a spaceIdOrDomain.`);
  }

  // Handle searching by page id only
  if (!spaceIdOrDomain && pageIdOrPathIsValidUUid) {
    searchQuery = {
      id: pageIdOrPath
    };
    // Handle searching by page path where page path might have been generated as a UUID
  } else if (spaceIdOrDomainIsValidUUid && pageIdOrPathIsValidUUid) {
    searchQuery = {
      spaceId: spaceIdOrDomain,
      OR: [
        {
          path: pageIdOrPath
        },
        {
          id: pageIdOrPath
        }
      ]
    };
    // Classic space domain + page path search
  } else if (!spaceIdOrDomainIsValidUUid && !pageIdOrPathIsValidUUid) {
    searchQuery = {
      space: {
        domain: spaceIdOrDomain
      },
      path: pageIdOrPath
    };
    // Space ID + page path search
  } else if (spaceIdOrDomainIsValidUUid && !pageIdOrPathIsValidUUid) {
    searchQuery = {
      spaceId: spaceIdOrDomain,
      path: pageIdOrPath
    };
    // Space domain received along with a UUID
  } else if (!spaceIdOrDomainIsValidUUid && pageIdOrPathIsValidUUid) {
    searchQuery = {
      space: {
        domain: spaceIdOrDomain
      },
      OR: [
        {
          path: pageIdOrPath
        },
        {
          id: pageIdOrPath
        }
      ]
    };
  } else {
    // This should never happen
    throw new InvalidInputError(`Invalid page id or path: ${pageIdOrPath} ${spaceIdOrDomain}`);
  }

  return searchQuery;
}
