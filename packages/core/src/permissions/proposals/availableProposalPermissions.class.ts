import type { ProposalOperation } from '@charmverse/core/prisma-client';

import { BasePermissions } from '../core/basePermissions.class';

import { proposalOperations } from './interfaces';

const readonlyOperations: ProposalOperation[] = ['view', 'view_notes', 'view_private_fields'];

export class AvailableProposalPermissions extends BasePermissions<ProposalOperation> {
  constructor({ isReadonlySpace }: { isReadonlySpace: boolean }) {
    const allowedOperations = isReadonlySpace ? readonlyOperations : proposalOperations;
    super({ allowedOperations });
  }
}
