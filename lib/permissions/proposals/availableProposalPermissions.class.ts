import { proposalOperations } from '@charmverse/core';
import type { ProposalOperation } from '@charmverse/core/dist/prisma';

import { BasePermissions } from '../basePermissions.class';

export class AvailableProposalPermissions extends BasePermissions<ProposalOperation> {
  constructor() {
    super({ allowedOperations: proposalOperations.slice() });
  }
}
