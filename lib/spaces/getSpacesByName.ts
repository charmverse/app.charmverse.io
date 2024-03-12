import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * For now, it is acceptable to return the entire space document to unauthenticated users
 * Supports lookup by space ID or space name or domain
 */
export async function getSpacesByName(spaceName: string): Promise<Space[]> {
  return prisma.space.findMany({
    where: {
      name: {
        search: `${spaceName
          .split(/\s/)
          .filter((s) => s)
          .join(' & ')}:*`
      }
    }
  });
}
