import type { Feature, MappedFeatures } from './constants';
import { STATIC_PAGES, pluralizedSingularizedFeatureTitlesRecord } from './constants';

export const getFeatureTitle = ({
  feature,
  capitalize,
  pluralize,
  mappedFeatures
}: {
  feature: Feature;
  pluralize?: boolean;
  capitalize?: boolean;
  mappedFeatures: MappedFeatures;
}) => {
  let featureTitle = mappedFeatures[feature].title;
  const staticPageFeature = STATIC_PAGES.find((page) => page.feature === feature)!;
  // Keep the current title without any modifications if its has been changed
  if (featureTitle !== staticPageFeature.title) {
    return capitalize ? featureTitle.charAt(0).toUpperCase() + featureTitle.slice(1) : featureTitle.toLowerCase();
  }

  featureTitle = pluralize
    ? pluralizedSingularizedFeatureTitlesRecord[feature].pluralized
    : pluralizedSingularizedFeatureTitlesRecord[feature].singularized;
  featureTitle = capitalize ? featureTitle.charAt(0).toUpperCase() + featureTitle.slice(1) : featureTitle.toLowerCase();
  return featureTitle;
};
