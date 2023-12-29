import { useCallback, useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { FeatureJson } from 'lib/features/constants';
import { constructFeaturesRecord } from 'lib/features/constructFeaturesRecord';
import type { FeatureTitleVariation } from 'lib/features/getFeatureTitle';
import { getFeatureTitle } from 'lib/features/getFeatureTitle';

export const useSpaceFeatures = () => {
  const { space, isLoading } = useCurrentSpace();

  const { features, mappedFeatures } = useMemo(() => {
    return constructFeaturesRecord((space?.features ?? []) as FeatureJson[]);
  }, [space?.features]);

  const _getFeatureTitle = useCallback(
    (featureTitle: FeatureTitleVariation) => {
      return getFeatureTitle({
        featureTitle,
        mappedFeatures
      });
    },
    [mappedFeatures]
  );

  return { features, mappedFeatures, isLoading, getFeatureTitle: _getFeatureTitle };
};
