import type { CredentialEventType } from '@charmverse/core/prisma-client';

import type { FeatureTitleVariation } from 'lib/features/getFeatureTitle';

// Labels require a mapper to rename features based on the space's settings
type LabelFn = (getFeatureTitle: (featureWord: FeatureTitleVariation) => string) => string;

// These constants are important as we use them for the labels in the UI and for string comparisons when indexing proposals
export const proposalCreatedVerb = 'Published';
export const proposalApprovedVerb = 'Approved';
export const rewardSubmissionApprovedVerb = 'Approved';

export const credentialEventLabels: Partial<Record<CredentialEventType, LabelFn>> = {
  proposal_created: (map) => `${proposalCreatedVerb} ${map('Proposal')}`,
  proposal_approved: (map) => `${map('Proposal')} ${proposalApprovedVerb}`,
  reward_submission_approved: (map) => `${map('Reward')} submission ${rewardSubmissionApprovedVerb}`
};
