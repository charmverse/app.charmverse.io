import type { CredentialEventType } from '@charmverse/core/prisma-client';
import { isDevEnv, isStagingEnv, isTestEnv } from '@packages/utils/constants';
import type { FeatureTitleVariation } from '@root/lib/features/getFeatureTitle';
import { optimism, optimismSepolia } from 'viem/chains';

// Labels require a mapper to rename features based on the space's settings
type LabelFn = (getFeatureTitle: (featureWord: FeatureTitleVariation) => string) => string;

// These constants are important as we use them for the labels in the UI and for string comparisons when indexing proposals
export const proposalCreatedVerb = 'Published';
export const proposalApprovedVerb = 'Approved';
export const rewardSubmissionApprovedVerb = 'Approved';

export const disableCredentialAutopublish = process.env.DISABLE_PUBLISHED_CREDENTIALS === 'true';

export const credentialEventLabels: Partial<Record<CredentialEventType, LabelFn>> = {
  proposal_created: (map) => `${proposalCreatedVerb} ${map('Proposal')}`,
  proposal_approved: (map) => `${map('Proposal')} ${proposalApprovedVerb}`,
  reward_submission_approved: (map) => `${map('Reward')} submission ${rewardSubmissionApprovedVerb}`
};

export const charmverseProjectDataChainId = isDevEnv || isTestEnv || isStagingEnv ? optimismSepolia.id : optimism.id;
