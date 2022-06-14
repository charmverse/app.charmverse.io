import { Role, Space, SpaceOperation, SpacePermission, User } from '@prisma/client';
import { RequiredNotNull } from 'lib/utilities/types';
import { PermissionAssignee, AssignablePermissionGroups, PermissionAssigneeId } from '../interfaces';

export type SpacePermissionModification<A extends AssignablePermissionGroups = AssignablePermissionGroups> = Pick<SpacePermission, 'forSpaceId' | 'operations'>
& PermissionAssigneeId<A>

export type SpacePermissionWithAssignee<A extends AssignablePermissionGroups = AssignablePermissionGroups> = SpacePermission
  & PermissionAssignee<A>
  & PermissionAssigneeId<A>

export type SpacePermissionFlags = {[key in SpaceOperation]: boolean}
