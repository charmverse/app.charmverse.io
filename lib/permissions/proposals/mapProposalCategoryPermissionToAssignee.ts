import type { AssignedProposalCategoryPermission } from '@charmverse/core';
import type { ProposalCategoryPermission } from '@charmverse/core/dist/prisma';

import { getPermissionAssignee } from '../utils';

export function mapProposalCategoryPermissionToAssignee(
  proposalCategoryPermission: ProposalCategoryPermission
): AssignedProposalCategoryPermission {
  return {
    id: proposalCategoryPermission.id,
    permissionLevel: proposalCategoryPermission.permissionLevel,
    proposalCategoryId: proposalCategoryPermission.proposalCategoryId,
    assignee: getPermissionAssignee(proposalCategoryPermission)
  };
}
