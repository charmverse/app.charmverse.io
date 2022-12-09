import { isProdEnv } from 'config/constants';

import { useCurrentSpace } from './useCurrentSpace';

/**
 * Returns true if the current space is charmverse, OR the current environment is not prod
 *
 * Use this hook for reserving some features in prod for charmverse users only
 */
export function useIsCharmverseSpace() {
  const currentSpace = useCurrentSpace();

  return !isProdEnv || (isProdEnv && currentSpace?.domain === 'charmverse');
}
