import type { ProposalCategoryPermission } from '@charmverse/core/dist/prisma';

import { getPermissionAssignee } from '../utils';

import type { AssignedProposalCategoryPermission } from './interfaces';

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
