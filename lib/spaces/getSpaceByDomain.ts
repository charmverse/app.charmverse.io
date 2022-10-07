import type { Space } from '@prisma/client';

import { prisma } from 'db';

export async function getSpaceByDomain (spaceDomain: string): Promise<Space | null> {
  return prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });
}
