import { BountyOperation, BountyPermissionLevel } from '@prisma/client';
import { UserPermissionFlags, TargetPermissionGroup, Resource } from '../interfaces';

export type BountyPermissionFlags = UserPermissionFlags<BountyOperation>

export type BountyPermissionAssignment = {
  level: BountyPermissionLevel
  assignee: TargetPermissionGroup
} & Resource

// The set of all permissions for an individual bounty
export type BountyPermissions = {[key in BountyPermissionLevel]: TargetPermissionGroup[]}
