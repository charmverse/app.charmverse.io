import { SpaceOperation } from '@charmverse/core/prisma';

export function spaceOperations() {
  return Object.keys(SpaceOperation) as SpaceOperation[];
}
