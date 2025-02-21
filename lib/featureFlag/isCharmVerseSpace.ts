import type { Space } from '@charmverse/core/prisma-client';
import { isDevEnv } from '@packages/utils/constants';

export const defaultDomains = ['charmverse'];

export function isCharmVerseSpace({
  space,
  allowedDomains = defaultDomains
}: {
  space: Pick<Space, 'domain'> | undefined;
  allowedDomains?: string[];
}): boolean {
  if (!space) {
    return false;
  }

  // check for CharmVerse spaces
  if (allowedDomains.includes(space.domain) || space.domain.startsWith('cvt-')) {
    return true;
  }
  // enable in dev mode
  return isDevEnv;
}
