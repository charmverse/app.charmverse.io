import { proposalCategoryOperations } from '@charmverse/core';
import type { ProposalCategoryOperation } from '@charmverse/core/dist/prisma';

import { BasePermissions } from '../basePermissions.class';

export class AvailableProposalCategoryPermissions extends BasePermissions<ProposalCategoryOperation> {
  constructor() {
    super({ allowedOperations: proposalCategoryOperations.slice() });
  }
}
