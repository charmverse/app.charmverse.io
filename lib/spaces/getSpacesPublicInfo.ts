import type { Space } from '@prisma/client';

import { prisma } from 'db';

/**
 * For now, it is acceptable to return the entire space document to unauthenticated users
 * Supports lookup by space ID or space name or domain
 */
export async function getSpacesPublicInfo (spaceIdOrDomainOrPageId: string): Promise<Space[]> {
  return prisma.space.findMany({
    where: {
      OR: [{
        name: {
          contains: spaceIdOrDomainOrPageId
        }
      }, {
        domain: {
          contains: spaceIdOrDomainOrPageId
        }
      }]
    }
  });
}
