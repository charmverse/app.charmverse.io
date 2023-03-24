import { SpaceOperation } from '@prisma/client';

export function spaceOperations() {
  return Object.keys(SpaceOperation) as SpaceOperation[];
}
