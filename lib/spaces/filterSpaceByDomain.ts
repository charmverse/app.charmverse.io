import type { Space } from '@charmverse/core/prisma';

import { isCustomDomain } from 'lib/spaces/utils';

export function filterSpaceByDomain(spaces: Space[], domainOrCustomDomain: string) {
  if (!domainOrCustomDomain) {
    return;
  }

  const space = spaces.find((s) => {
    if (isCustomDomain(domainOrCustomDomain)) {
      return !!s.customDomain && s.customDomain === domainOrCustomDomain;
    }

    return s.domain === domainOrCustomDomain;
  });

  return space;
}
