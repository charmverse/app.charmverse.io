import type { Space } from '@charmverse/core/prisma-client';

import { isDevEnv, isProdEnv, isTestEnv } from 'config/constants';

export const defaultDomains = ['charmverse'];

export function isCharmVerseSpace({
  space,
  allowedDomains = defaultDomains,
  alwaysTrueInTestEnv
}: {
  space: Pick<Space, 'domain'> | undefined;
  allowedDomains?: string[];
  alwaysTrueInTestEnv?: boolean;
}): boolean {
  if (!space) {
    return false;
  }

  // check for CharmVerse spaces
  if (allowedDomains.includes(space.domain) || space.domain.startsWith('cvt-')) {
    return true;
  }

  if (isProdEnv) {
    return false;
  }

  // enable in dev mode
  return isDevEnv || (!!alwaysTrueInTestEnv && isTestEnv);
}
