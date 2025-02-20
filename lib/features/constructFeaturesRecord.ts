import { sortArrayByObjectProperty } from '@packages/utils/array';

import type { FeatureJson, MappedFeature, FeatureMap } from './constants';
import { STATIC_PAGES } from './constants';

export function constructFeaturesRecord(features: FeatureJson[]) {
  const dbFeatures = Object.fromEntries(features.map((_feat) => [_feat.id, _feat]));

  const sortedFeatures = sortArrayByObjectProperty(
    STATIC_PAGES,
    'feature',
    features.map((feat) => feat.id)
  );

  const extendedFeatures: MappedFeature[] = sortedFeatures.map(({ feature, ...restFeat }) => ({
    ...restFeat,
    id: feature,
    isHidden: !!dbFeatures[feature]?.isHidden,
    title: dbFeatures[feature]?.title || restFeat.title
  }));

  const mappedFeatures = extendedFeatures.reduce((acc, val) => {
    acc[val.id] = val;
    return acc;
  }, {} as FeatureMap);

  return {
    features: extendedFeatures,
    mappedFeatures
  };
}
