import { isCharmVerseSpace } from '@packages/lib/featureFlag/isCharmVerseSpace';

import { useCurrentSpace } from './useCurrentSpace';

/**
 * Feature flag utility hook
 *
 * Use this hook for reserving some features in prod for CharmVerse spaces only
 */
export function useIsCharmverseSpace(allowedDomains?: string[]) {
  const { space: currentSpace } = useCurrentSpace();

  return isCharmVerseSpace({ allowedDomains, space: currentSpace });
}
