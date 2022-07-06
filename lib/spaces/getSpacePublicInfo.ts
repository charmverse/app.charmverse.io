import { Space } from '@prisma/client';
import { prisma } from 'db';
import { validate } from 'uuid';
import { PublicSpaceInfo } from './interfaces';

/**
 * For now, it is acceptable to return the entire space document to unauthenticated users
 * Supports lookup by space ID or space domain
 */
export async function getSpacePublicInfo (spaceIdOrDomain: string): Promise<Space | null> {

  if (validate(spaceIdOrDomain) === false) {
    return prisma.space.findUnique({
      where: {
        // Not a valid UUID, lookup by domain
        domain: spaceIdOrDomain
      }
    });
  }

  return prisma.space.findUnique({
    where: {
      id: spaceIdOrDomain
    }
  });

}
