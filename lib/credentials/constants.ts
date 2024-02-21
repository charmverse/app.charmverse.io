import type { CredentialEventType } from '@charmverse/core/prisma-client';

import type { FeatureTitleVariation } from 'lib/features/getFeatureTitle';

// Labels require a mapper to rename features based on the space's settings
type LabelFn = (getFeatureTitle: (featureWord: FeatureTitleVariation) => string) => string;

export const credentialEventLabels: Partial<Record<CredentialEventType, LabelFn>> = {
  proposal_created: (map) => `Published ${map('Proposal')}`,
  proposal_approved: (map) => `${map('Proposal')} Approved`,
  reward_submission_approved: (map) => `${map('Reward')} submission Approved`
};
