import { prisma } from 'db';

import type { SpaceWithGates } from './interfaces';

/**
 * For now, it is acceptable to return the entire space document to unauthenticated users
 * Supports lookup by space ID or space name or domain
 */
export async function getSpacesByName(spaceName: string): Promise<SpaceWithGates[]> {
  return prisma.space.findMany({
    where: {
      name: {
        search: `${spaceName
          .split(/\s/)
          .filter((s) => s)
          .join(' & ')}:*`
      }
    },
    include: {
      tokenGates: true
    }
  });
}
