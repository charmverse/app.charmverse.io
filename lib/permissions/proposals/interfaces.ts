import type { ProposalCategory, ProposalCategoryPermissionLevel } from '@prisma/client';
import { ProposalCategoryOperation, ProposalOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import type { AssignablePermissionGroupsWithPublic, TargetPermissionGroup, UserPermissionFlags } from '../interfaces';

export type AssignableProposalCategoryPermissionGroups = Extract<
  AssignablePermissionGroupsWithPublic,
  'role' | 'space' | 'public'
>;

export const proposalCategoryPermissionGroups: AssignableProposalCategoryPermissionGroups[] = [
  'role',
  'space',
  'public'
];

export const proposalOperations = [...typedKeys(ProposalOperation)] as const;
export const proposalCategoryOperations = [...typedKeys(ProposalCategoryOperation)] as const;

export type AvailableProposalPermissionFlags = UserPermissionFlags<ProposalOperation>;
export type AvailableProposalCategoryPermissionFlags = UserPermissionFlags<ProposalCategoryOperation>;

export type AssignedProposalCategoryPermission<
  T extends AssignableProposalCategoryPermissionGroups = AssignableProposalCategoryPermissionGroups
> = {
  id: string;
  proposalCategoryId: string;
  permissionLevel: ProposalCategoryPermissionLevel;
  assignee: TargetPermissionGroup<T>;
};
/**
 * When returning proposal categories, also pre-compute if a user can add a proposal to that category
 */
export type ProposalCategoryWithPermissions = ProposalCategory & {
  permissions: AvailableProposalCategoryPermissionFlags;
};
