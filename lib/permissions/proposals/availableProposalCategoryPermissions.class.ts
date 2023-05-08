import type { ProposalCategoryOperation } from '@charmverse/core/prisma';

import { BasePermissions } from '../basePermissions.class';

export class AvailableProposalCategoryPermissions extends BasePermissions<ProposalCategoryOperation> {
  constructor() {
    super({ allowedOperations: [] });
  }
}
