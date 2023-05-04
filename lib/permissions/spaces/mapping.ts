import { SpaceOperation } from '@charmverse/core/dist/prisma';

export function spaceOperations() {
  return Object.keys(SpaceOperation) as SpaceOperation[];
}
