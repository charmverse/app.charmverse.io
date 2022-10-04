import type { Space } from '@prisma/client';
import { validate } from 'uuid';

import { prisma } from 'db';

import { PublicSpaceInfo } from './interfaces';

/**
 * For now, it is acceptable to return the entire space document to unauthenticated users
 * Supports lookup by space ID or space domain
 */
export async function getSpacePublicInfo (spaceIdOrDomainOrPageId: string): Promise<Space | null> {

  if (validate(spaceIdOrDomainOrPageId) === false) {
    return prisma.space.findUnique({
      where: {
        // Not a valid UUID, lookup by domain
        domain: spaceIdOrDomainOrPageId
      }
    });
  }

  return prisma.space.findFirst({
    where: {
      OR: [{
        id: spaceIdOrDomainOrPageId
      }, {
        pages: {
          some: {
            id: spaceIdOrDomainOrPageId
          }
        }
      }]
    }
  });

}
