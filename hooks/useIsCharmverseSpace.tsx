import { isDevEnv } from 'config/constants';

import { useCurrentSpace } from './useCurrentSpace';

const defaultDomains = ['charmverse'];

/**
 * Feature flag utility hook
 *
 * Use this hook for reserving some features in prod for CharmVerse spaces only
 */
export function useIsCharmverseSpace(allowedDomains = defaultDomains) {
  const { space: currentSpace } = useCurrentSpace();

  // check for CharmVerse spaces
  if (allowedDomains.includes(currentSpace?.domain ?? '') || currentSpace?.domain.startsWith('cvt-')) {
    return true;
  }
  // enable in test and dev mode
  return isDevEnv;
}
