import { prisma } from '@charmverse/core';

import type { SpaceWithGates } from './interfaces';

export async function getSpaceByDomain(spaceDomain: string): Promise<SpaceWithGates | null> {
  return prisma.space.findUnique({
    where: {
      domain: spaceDomain
    },
    include: {
      tokenGates: {
        include: {
          tokenGateToRoles: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });
}
