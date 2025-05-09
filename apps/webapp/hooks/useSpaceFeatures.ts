import type { FeatureJson } from '@packages/features/constants';
import { constructFeaturesRecord } from '@packages/features/constructFeaturesRecord';
import type { FeatureTitleVariation } from '@packages/features/getFeatureTitle';
import { getFeatureTitle } from '@packages/features/getFeatureTitle';
import { useCallback, useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';

export const useSpaceFeatures = () => {
  const { space, isLoading } = useCurrentSpace();

  const spaceFeatures = useMemo(() => (space?.features ?? []) as FeatureJson[], [space?.features]);

  const { features, mappedFeatures } = useMemo(() => {
    return constructFeaturesRecord(spaceFeatures);
  }, [spaceFeatures]);

  const _getFeatureTitle = useCallback(
    (featureTitle: FeatureTitleVariation) => {
      return getFeatureTitle(featureTitle, spaceFeatures);
    },
    [spaceFeatures]
  );

  return { features, mappedFeatures, isLoading, getFeatureTitle: _getFeatureTitle };
};
