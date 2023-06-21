import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utilities/types';

const DEFAULT_ORIGINS = ['.charmverse.co', '.charmverse.io'];

class AllowedOriginsCache {
  allowedOrigins: string[] | null = null;

  constructor() {
    this.refreshOrigins();
  }

  async refreshOrigins() {
    const spaceCustomDomains = await prisma.space.findMany({
      where: {
        customDomain: { not: null }
      },
      select: {
        customDomain: true
      }
    });

    const customOrigins = spaceCustomDomains.map((space) => space.customDomain).filter(isTruthy);

    this.allowedOrigins = [...DEFAULT_ORIGINS, ...customOrigins];
  }
}

export const allowedOriginsCache = new AllowedOriginsCache();
