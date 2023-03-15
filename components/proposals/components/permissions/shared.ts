import type { ProposalCategoryPermissionLevel } from '@prisma/client';

import { proposalCategoryPermissionLabels } from 'lib/permissions/proposals/mapping';

// eslint-disable-next-line camelcase
export const permissionsWithRemove = { ...proposalCategoryPermissionLabels, delete: 'Remove' };

export const proposalCategoryPermissionOptions = permissionsWithRemove;

export type BulkRoleProposalCategoryPermissionUpsert = {
  permissionLevel: ProposalCategoryPermissionLevel;
  roleIds: string[];
};
