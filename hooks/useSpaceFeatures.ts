import { useCallback, useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { Feature, FeatureJson } from 'lib/features/constants';
import { constructFeaturesRecord } from 'lib/features/constructFeaturesRecord';
import { getFeatureTitle } from 'lib/features/getFeatureTitle';

export const useSpaceFeatures = () => {
  const { space, isLoading } = useCurrentSpace();

  const { features, mappedFeatures } = useMemo(() => {
    return constructFeaturesRecord((space?.features ?? []) as FeatureJson[]);
  }, [space?.features]);

  const _getFeatureTitle = useCallback(
    ({ feature, capitalize, pluralize }: { feature: Feature; pluralize?: boolean; capitalize?: boolean }) => {
      return getFeatureTitle({
        feature,
        mappedFeatures,
        capitalize,
        pluralize
      });
    },
    [mappedFeatures]
  );

  return { features, mappedFeatures, isLoading, getFeatureTitle: _getFeatureTitle };
};
