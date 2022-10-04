import type { BountyOperation, BountyPermissionLevel } from '@prisma/client';

import type { UserPermissionFlags, TargetPermissionGroup, Resource, AssignablePermissionGroupsWithPublic } from '../interfaces';

export type BountyPermissionFlags = UserPermissionFlags<BountyOperation>

// Used for inserting and deleting permissions
export type BountyPermissionAssignment = {
  level: BountyPermissionLevel;
  assignee: TargetPermissionGroup;
} & Resource

// The set of all permissions for an individual bounty
export type BountyPermissions = { [key in BountyPermissionLevel]: TargetPermissionGroup[] }

// Groups that can be assigned to various bounty actions
export type BountyReviewer = Extract<AssignablePermissionGroupsWithPublic, 'role' | 'user'>

export type BountySubmitter = Extract<AssignablePermissionGroupsWithPublic, 'space' | 'role'>

export interface AssignedBountyPermissions {
  bountyPermissions: BountyPermissions;
  userPermissions: BountyPermissionFlags;
}

export type BulkBountyPermissionAssignment = {
  bountyId: string;
  // We don't need resource id since the bountyId is global
  permissionsToAssign: (Omit<BountyPermissionAssignment, 'resourceId'>[]) | Partial<BountyPermissions>;
}

export interface InferredBountyPermissionMode {mode: BountySubmitter, roles?: string[]}

// For now, we only want to write about who can submit, and who can review
export type SupportedHumanisedAccessConditions = Extract<BountyPermissionLevel, 'submitter' | 'reviewer'>

export interface HumanisedBountyAccessSummary {
  permissionLevel: SupportedHumanisedAccessConditions;
  phrase: string;
  // Should be empty if the target permission level is accessible to the whole space
  roleNames: string[];
  // If all workspace members can perform this action, then the number is not provided, only if roles and people are selected
  totalPeople?: number;
}
