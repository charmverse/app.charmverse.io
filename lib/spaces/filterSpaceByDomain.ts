import type { Space } from '@charmverse/core/prisma';

export function filterSpaceByDomain(spaces: Space[], domainOrCustomDomain: string) {
  if (!domainOrCustomDomain) {
    return;
  }

  const isCustomDomain = domainOrCustomDomain.includes('.');

  const space = spaces.find((s) => {
    if (isCustomDomain) {
      return !!s.customDomain && s.customDomain === domainOrCustomDomain;
    }

    return s.domain === domainOrCustomDomain;
  });

  return space;
}
