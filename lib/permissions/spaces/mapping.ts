import { SpaceOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

export const spaceOperationLabels: Record<SpaceOperation, string> = {
  createPage: 'Create new pages',
  createBounty: 'Create new bounties',
  createVote: 'Create new proposals',
  createForumCategory: 'Create new forum categories',
  moderateForums: 'Moderate all forum categories',
  reviewProposals: 'Review proposals'
};

export const spaceOperationDescriptions: Record<SpaceOperation, string> = {
  createPage: 'Create new pages',
  createBounty: 'Create new bounties',
  createVote: 'Create new proposals',
  createForumCategory: 'Create new forum categories',
  moderateForums: 'Moderate all forum categories',
  reviewProposals: 'Be selected to review proposals'
};

export function spaceOperations() {
  return Object.keys(SpaceOperation) as SpaceOperation[];
}

// We don't want to have explicit support for forum categories in space permissions config yet
export const spaceOperationsWithoutForumCategory = typedKeys(spaceOperationLabels).filter(
  (key) => key !== 'createForumCategory'
);
