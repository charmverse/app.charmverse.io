import type { Feature } from '@charmverse/core/prisma-client';
import { useMemo } from 'react';

import type { FeatureJson, StaticPageType } from 'components/common/PageLayout/components/Sidebar/constants';
import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { sortArrayByObjectProperty } from 'lib/utilities/array';

type MappedFeatures = Record<
  Feature,
  {
    id: Feature;
    isHidden: boolean;
    title: string;
    path: StaticPageType;
  }
>;

export const useSpaceFeatures = () => {
  const { space, isLoading } = useCurrentSpace();

  const features = useMemo(() => {
    const dbFeatures = Object.fromEntries(((space?.features || []) as FeatureJson[]).map((_feat) => [_feat.id, _feat]));

    const sortedFeatures = sortArrayByObjectProperty(
      STATIC_PAGES,
      'feature',
      ((space?.features || []) as FeatureJson[]).map((feat) => feat.id)
    );

    const extendedFeatures = sortedFeatures.map(({ feature, ...restFeat }) => ({
      ...restFeat,
      id: feature,
      isHidden: !!dbFeatures[feature]?.isHidden,
      title: dbFeatures[feature]?.title || restFeat.title
    }));

    return extendedFeatures;
  }, [space?.features]);

  const mappedFeatures = useMemo(() => {
    return features.reduce((acc, val) => {
      acc[val.id] = val;
      return acc;
    }, {} as MappedFeatures);
  }, [features]);

  return { features, mappedFeatures, isLoading };
};
