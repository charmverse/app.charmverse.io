import { capitalize } from '@root/lib/utils/strings';

import type { FeatureJson, Feature } from './constants';
import { STATIC_PAGES } from './constants';
import { constructFeaturesRecord } from './constructFeaturesRecord';

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

export const getFeatureTitle = (featureTitle: FeatureTitleVariation, features: FeatureJson[] = []) => {
  const { mappedFeatures } = constructFeaturesRecord(features);
  const feature = featureTitleRecord[featureTitle];
  const featureCurrentTitle = mappedFeatures[feature]?.title;
  const staticPageFeature = STATIC_PAGES.find((page) => page.feature === feature)!;

  let result: string = featureTitle;
  // Keep the current title without any modifications if its has been changed
  if (featureCurrentTitle && featureCurrentTitle !== staticPageFeature.title) {
    const isCapitalized = featureTitle.charAt(0) === featureTitle.charAt(0).toUpperCase();
    const isPlural = featureTitle.charAt(featureTitle.length - 1) === 's';
    result = featureCurrentTitle.toLocaleLowerCase();
    if (isCapitalized) {
      result = capitalize(featureCurrentTitle);
    }
    if (!isPlural) {
      result = singular(result);
    }
  }

  return result;
};

// Handles only s and ies word. A more thorough solution can be found on Stackoverflow: https://stackoverflow.com/a/57129703/1304395
function singular(word: string) {
  if (word.endsWith('ies')) {
    return word.replace(/ies$/, 'y');
  }
  return word.replace(/s$/, '');
}
