import { SpaceOperation } from '@prisma/client';

import { BasePermissions } from '../basePermissions.class';

export class AvailableSpacePermissions extends BasePermissions<SpaceOperation> {
  createPage: boolean = false;

  createBounty: boolean = false;

  createVote: boolean = false;

  createForumCategory: boolean = false;

  moderateForums: boolean = false;

  reviewProposals: boolean = false;

  constructor(operations: SpaceOperation[] = []) {
    super({ allowedOperations: Object.keys(SpaceOperation) as SpaceOperation[] });

    this.addPermissions(operations);
  }
}
