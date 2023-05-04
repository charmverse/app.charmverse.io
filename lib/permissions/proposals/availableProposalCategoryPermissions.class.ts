import type { ProposalCategoryOperation } from '@charmverse/core/dist/prisma';

import { BasePermissions } from '../basePermissions.class';

import { proposalCategoryOperations } from './interfaces';

export class AvailableProposalCategoryPermissions extends BasePermissions<ProposalCategoryOperation> {
  constructor() {
    super({ allowedOperations: proposalCategoryOperations.slice() });
  }
}
