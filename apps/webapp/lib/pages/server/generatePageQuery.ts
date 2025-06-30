import type { Prisma } from '@charmverse/core/prisma';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

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

  if (!pageIdOrPath) {
    throw new InvalidInputError(`You must provide a page id or path to fetch a page.`);
  } else if (!spaceIdOrDomain && !pageIdOrPathIsValidUUid) {
    throw new InvalidInputError(`To fetch a page by path, you must also provide a spaceIdOrDomain.`);
  }

  // Handle searching by page id only
  if (pageIdOrPathIsValidUUid) {
    return {
      spaceId: spaceIdOrDomainIsValidUUid ? spaceIdOrDomain : undefined,
      space:
        spaceIdOrDomain && !spaceIdOrDomainIsValidUUid
          ? {
              domain: spaceIdOrDomain
            }
          : undefined,
      OR: [
        {
          id: pageIdOrPath
        },
        {
          path: pageIdOrPath
        },
        {
          additionalPaths: {
            has: pageIdOrPath
          }
        }
      ]
    };
    // Handle searching by page path where page path might have been generated as a UUID
  }

  return {
    spaceId: spaceIdOrDomainIsValidUUid ? spaceIdOrDomain : undefined,
    space:
      spaceIdOrDomain && !spaceIdOrDomainIsValidUUid
        ? {
            domain: spaceIdOrDomain
          }
        : undefined,
    OR: [
      {
        path: pageIdOrPath
      },
      {
        additionalPaths: {
          has: pageIdOrPath
        }
      }
    ]
  };
}
