import { SpaceOperation } from '@charmverse/core/prisma-client';

import { typedKeys } from '../../utilities/objects';
import { BasePermissions } from '../core/basePermissions.class';

const readonlyOperations: SpaceOperation[] = [];

export class AvailableSpacePermissions extends BasePermissions<SpaceOperation> {
  constructor({ isReadonlySpace }: { isReadonlySpace: boolean }) {
    const allowedOperations = isReadonlySpace ? readonlyOperations : typedKeys(SpaceOperation);
    super({ allowedOperations });
  }
}
