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
