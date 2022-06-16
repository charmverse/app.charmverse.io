import { SpaceOperation } from '@prisma/client';

export const spaceOperationLabels: Record<SpaceOperation, string> = {
  createPage: 'Create new pages',
  createBounty: 'Create new bounties'
};

export function spaceOperations () {
  return Object.keys(SpaceOperation) as SpaceOperation[];
}
