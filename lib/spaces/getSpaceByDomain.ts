import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { isCustomDomain } from 'lib/spaces/utils';

export async function getSpaceByDomain(spaceDomainOrCustomDomain: string): Promise<Space | null> {
  return prisma.space.findUnique({
    where: getSpaceByDomainWhere(spaceDomainOrCustomDomain)
  });
}

export function getSpaceByDomainWhere(spaceDomainOrCustomDomain: string): {
  domain: string | undefined;
  customDomain: string | undefined;
} {
  const domain = isCustomDomain(spaceDomainOrCustomDomain) ? undefined : spaceDomainOrCustomDomain;
  const customDomain = isCustomDomain(spaceDomainOrCustomDomain) ? spaceDomainOrCustomDomain : undefined;

  return {
    domain,
    customDomain
  };
}
