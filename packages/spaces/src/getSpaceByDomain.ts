import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { isCustomDomain } from './utils';

export async function getSpaceByDomain(spaceDomainOrCustomDomain: string): Promise<Space | null> {
  return prisma.space.findUnique({
    where: getSpaceByDomainWhere(spaceDomainOrCustomDomain)
  });
}

export function getSpaceByDomainWhere(spaceDomainOrCustomDomain: string): {
  domain: string | undefined;
  customDomain: string | undefined;
} {
  if (isCustomDomain(spaceDomainOrCustomDomain)) {
    return { customDomain: spaceDomainOrCustomDomain.toLowerCase(), domain: undefined };
  }

  return { domain: spaceDomainOrCustomDomain.toLowerCase(), customDomain: undefined };
}
