import type { ProposalCategoryPermission } from '@prisma/client';

import { InvalidPermissionGranteeError } from '../errors';

import type { AssignedProposalCategoryPermission } from './interfaces';

export function mapProposalCategoryPermissionToAssignee(
  proposalCategoryPermission: ProposalCategoryPermission
): AssignedProposalCategoryPermission {
  const baseAssigneeData: Pick<AssignedProposalCategoryPermission, 'permissionLevel' | 'proposalCategoryId' | 'id'> = {
    id: proposalCategoryPermission.id,
    permissionLevel: proposalCategoryPermission.permissionLevel,
    proposalCategoryId: proposalCategoryPermission.proposalCategoryId
  };

  // Make sure we always have a single assignee
  if (proposalCategoryPermission.public && !proposalCategoryPermission.roleId && !proposalCategoryPermission.spaceId) {
    return {
      ...baseAssigneeData,
      assignee: {
        group: 'public'
      }
    };
  } else if (proposalCategoryPermission.roleId && !proposalCategoryPermission.spaceId) {
    return {
      ...baseAssigneeData,
      assignee: {
        group: 'role',
        id: proposalCategoryPermission.roleId
      }
    };
  } else if (proposalCategoryPermission.spaceId) {
    return {
      ...baseAssigneeData,
      assignee: {
        group: 'space',
        id: proposalCategoryPermission.spaceId
      }
    };
  }

  throw new InvalidPermissionGranteeError();
}
