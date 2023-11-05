// import type { SpaceInclude } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { getSpaceByDomainWhere } from 'lib/spaces/getSpaceByDomain';

import type { SpaceWithGates } from './interfaces';

export async function getSpaceWithTokenGates(spaceDomainOrCustomDomain: string): Promise<SpaceWithGates | null> {
  return prisma.space.findUnique({
    where: getSpaceByDomainWhere(spaceDomainOrCustomDomain),
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
