import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utilities/types';

const DEFAULT_ORIGINS = ['.charmverse.co', '.charmverse.io'];

class AllowedOriginsCache {
  origins: string[] | null = null;

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

    this.origins = [...DEFAULT_ORIGINS, ...customOrigins];
  }

  get allowedOrigins() {
    return this.origins;
  }
}

export const allowedOriginsCache = new AllowedOriginsCache();
