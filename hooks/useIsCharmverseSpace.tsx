import { isProdEnv } from 'config/constants';

import { useCurrentSpace } from './useCurrentSpace';

const defaultDomains = ['charmverse'];

/**
 * Returns true if the current space is charmverse, OR the current environment is not prod
 *
 * Use this hook for reserving some features in prod for charmverse users only
 */
export function useIsCharmverseSpace(allowedDomains = defaultDomains) {
  const currentSpace = useCurrentSpace();

  return !isProdEnv || allowedDomains.includes(currentSpace?.domain ?? '') || currentSpace?.domain.startsWith('cvt-');
}
