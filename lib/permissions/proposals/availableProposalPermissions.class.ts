import type { ProposalOperation } from '@charmverse/core/prisma';

import { BasePermissions } from '../basePermissions.class';

export class AvailableProposalPermissions extends BasePermissions<ProposalOperation> {
  constructor() {
    super({ allowedOperations: [] });
  }
}
