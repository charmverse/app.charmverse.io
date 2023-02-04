import { SpaceOperation } from '@prisma/client';

export const spaceOperationLabels: Record<SpaceOperation, string> = {
  createPage: 'Create new pages',
  createBounty: 'Create new bounties',
  createVote: 'Create new proposals',
  createForumCategory: 'Create new forum categories'
};

export function spaceOperations() {
  return Object.keys(SpaceOperation) as SpaceOperation[];
}

// We don't want to have explicit support for forum categories in space permissions config yet
export const spaceOperationsWithoutForumCategory = ['createPage', 'createBounty', 'createVote'] as const;
