import type { Feature, FeatureMap } from './constants';
import { STATIC_PAGES } from './constants';

export type FeatureTitleVariation =
  | 'reward'
  | 'proposal'
  | 'rewards'
  | 'proposals'
  | 'Rewards'
  | 'Proposals'
  | 'Reward'
  | 'Proposal'
  | 'member_directory'
  | 'Member_Directory'
  | 'Forum'
  | 'forum';

const featureTitleRecord: Record<FeatureTitleVariation, Feature> = {
  Proposal: 'proposals',
  proposal: 'proposals',
  Proposals: 'proposals',
  proposals: 'proposals',
  Reward: 'rewards',
  reward: 'rewards',
  Rewards: 'rewards',
  rewards: 'rewards',
  Forum: 'forum',
  forum: 'forum',
  Member_Directory: 'member_directory',
  member_directory: 'member_directory'
};

export const getFeatureTitle = ({
  featureTitle,
  mappedFeatures
}: {
  featureTitle: FeatureTitleVariation;
  mappedFeatures: FeatureMap;
}) => {
  const isCapitalized = featureTitle.charAt(0) === featureTitle.charAt(0).toUpperCase();
  const feature = featureTitleRecord[featureTitle];
  const featureCurrentTitle = mappedFeatures[feature].title;
  const staticPageFeature = STATIC_PAGES.find((page) => page.feature === feature)!;
  // Keep the current title without any modifications if its has been changed
  if (featureCurrentTitle !== staticPageFeature.title) {
    return isCapitalized
      ? featureCurrentTitle.charAt(0).toUpperCase() + featureCurrentTitle.slice(1)
      : featureCurrentTitle.toLowerCase();
  }

  return featureTitle;
};
